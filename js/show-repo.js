google.charts.setOnLoadCallback(parseURL);

function parseURL() {
    if (params.action === "show-repo" && params.repo) showRepo(params.repo);
}

function showRepo(repo) {
    var committers         = new Set();
    var committersList     = document.getElementById("committers");
    var latestCommits      = [];
    var latestCommitsStats = [];

    consumeAllCommits(repo, function (commitJSON, eof) {
        var committer = commitJSON.commit.committer;
        if (!committers.has(committer.name)) {
            var item       = document.createElement("li");
            item.innerHTML = "Name: " + committer.name + ". Contact e-mail: " + committer.email;
            committersList.appendChild(item);
            committers.add(committer.name);
        }
        generateGitStats(commitJSON, latestCommits, latestCommitsStats, eof);
    });
}

function generateGitStats(commitJSON, latestCommits, latestCommitsStats, eof) {
    var commit    = commitJSON.commit;
    var committer = commit.committer;

    //if (latestCommitsStats.length < 100) {
        latestCommits     .push({ committerName: committer.name, message: commit.message, date: new Date(committer.date) });
        latestCommitsStats.push(new CommitStat(committer.name, 1));
    //}
    if (eof) {
        var committersStats = new Map();
        for (let commitStat of latestCommitsStats) {
            var existingStat = committersStats.get(commitStat.committerName);
            committersStats.set(commitStat.committerName, !existingStat ? commitStat : existingStat.sum(commitStat));
        }

        var stats = Array.from(committersStats.values())
                         .sort(function(x, y) { return y.commits - x.commits })
                         .map(function(stat) { return new Array(stat.committerName, stat.commits) });
        stats.unshift(new Array("Committer", "Commits"));

        displayBestCommittersChart(stats);
        displayCommitsTimelineChart(latestCommits, stats.length);
    }
}

function displayBestCommittersChart(stats) {
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
    var commitsByAuthorAndDate = { };
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

function CommitStat(committerName, commits) {
    this.committerName = committerName;
    this.commits       = commits;
    this.sum           = function(that) {
        return this.committerName !== that.committerName ? undefined : new CommitStat(this.committerName, this.commits + that.commits);
    }
}