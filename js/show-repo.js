google.charts.setOnLoadCallback(parseURL);

function parseURL() {
    if (params.action === "show-repo" && params.repo) showRepo(params.repo);
}

function showRepo(repo) {
    var committers         = new Set();
    var committersList     = document.getElementById("committers");
    var latestCommits      = [];

    consumeAllCommits(repo, function (commitJSON, eof) {
        var committer = commitJSON.commit.committer;
        if (!committers.has(committer.name)) {
            var item       = document.createElement("li");
            item.innerHTML = "Name: " + committer.name + ". Contact e-mail: " + committer.email;
            committersList.appendChild(item);
            committers.add(committer.name);
        }
        generateGitStats(commitJSON, latestCommits, committers, eof);
    });

    callGitApi("repos/" + repo + "/stats/contributors", displayLinesContributionChart);
}

function generateGitStats(commitJSON, latestCommits, committers, eof) {
    var commit    = commitJSON.commit;
    var committer = commit.committer;

    //if (latestCommits.length < 100) {
        latestCommits.push({ committerName: committer.name, message: commit.message, date: new Date(committer.date) });
    //}
    if (eof) {
        displayBestCommittersChart(latestCommits);
        displayCommitsTimelineChart(latestCommits, committers.size);
    }
}

function displayBestCommittersChart(commits) {
    var committersStats = new Map();
    for (let commit of commits) {
        var existingStat = committersStats.get(commit.committerName);
        committersStats.set(commit.committerName, (!existingStat ? 0 : existingStat) + 1);
    }

    var stats = Array.from(committersStats.entries()).sort(function(x, y) { return y[1] - x[1]; });
    stats.unshift(new Array("Committer", "Commits"));

    var data = new google.visualization.arrayToDataTable(stats);
    var chart = new google.charts.Bar(document.getElementById('bestCommittersChart'));
    var options = {
        title: 'Best committers',
        width: stats.length * 90,
        height: stats.length * 60,
        legend: { position: 'none' },
        chart: { title: 'Best committers', subtitle: '(by number of commits)' },
        bars: 'horizontal',
        axes: {
            x: { 0: { side: 'top', label: 'Commits'} },
            y: { 0: { side: 'left', label: 'Committer'} }
        },
        bar: { groupWidth: "90%" }
    };
    chart.draw(data, options);
}

function displayLinesContributionChart(contributions) {
    if (!contributions[0]) return;

    var committers = [];
    var data       = [];
    var first      = true;

    for (let week of contributions[0].weeks) data.push([ new Date(week.w * 1000) ]);

    var latestWeekWithData = 0;
    for (let contribution of contributions) {
        committers.push(contribution.author.login);

        var total = 0;
        var weeks = contribution.weeks;
        for (var i = 0; i < weeks.length; i++) {
            var changesThisWeek = weeks[i].a + weeks[i].d;
            data[i].push(total += changesThisWeek);
            if (changesThisWeek > 0) { console.log(changesThisWeek, latestWeekWithData); latestWeekWithData = Math.max(latestWeekWithData, i); }
        }
    }

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("date", "Time");

    for (let committer of committers) dataTable.addColumn("number", committer);
    dataTable.addRows(data.slice(0, latestWeekWithData + 1));

    var options = {
        height: 400,
        hAxis: {
            title: "Time",
            format: "MMM d, y"
        },
        vAxis: {
          title: "Total contributions"
        },
        legend: { position: "bottom" }
    };

    var chart = new google.visualization.LineChart(document.getElementById("commitsOvertimeChart"));
    chart.draw(dataTable, options);
}

function displayCommitsTimelineChart(commits, numberOfCommitters) {
    var chart     = new google.visualization.Timeline(document.getElementById('commitsTimelineChart'));
    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Committer' });
    dataTable.addColumn({ type: 'string', id: 'dummy bar label' });
    dataTable.addColumn({ type: 'string', role: 'tooltip', 'p': {'html': true} });
    dataTable.addColumn({ type: 'date', id: 'Date' });
    dataTable.addColumn({ type: 'date', id: 'Date+1' });

    var getKey = function(commit) { return commit.committerName + "," + commit.date.roundToDay().getTime(); }

    // group the commits by author and date
    var commitsByAuthorAndDate = new Map();
    for (let commit of commits) {
        var key           = getKey(commit);
        var existingValue = commitsByAuthorAndDate.get(key);
        var newValue      = !existingValue ? [ ] : existingValue;
        newValue.push(commit);
        commitsByAuthorAndDate.set(key, newValue);
    }

    dataTable.addRows(Array.from(commitsByAuthorAndDate.entries()).map(function(entry) {
        var split         = entry[0].split(",");
        var committerName = split[0];
        var day           = new Date(parseInt(split[1]));
        var tooltip       = "<ul>" + entry[1].map(function(commit) { return "<li><b>" + commit.date + ":</b> " + commit.message + "</li>"; }).join("") + "</ul>";
        return new Array(committerName, "", tooltip, day, day.plusDays(1));
    }));
    chart.draw(dataTable, { height: numberOfCommitters * 90 });
}

function consumeAllCommits(repo, commitConsumer) {
    consumeCommitsRec(repo, 1, commitConsumer);
}

function consumeCommitsRec(repo, pageIndex, commitConsumer) {
    getCommitsPage(repo, pageIndex, function(commits, eof) {
        for (var i = 0; i < commits.length; i++) commitConsumer(commits[i], eof && i == commits.length - 1);
        if (!eof) consumeCommitsRec(repo, pageIndex + 1, commitConsumer);
    });
}

function getCommitsPage(repo, pageIndex, callback) {
    var expectedCommits = 100;
    callGitApi("repos/" + repo + "/commits?per_page=" + expectedCommits + "&page=" + pageIndex, function(commits) {
        callback(commits, commits.length < expectedCommits);
    });
}