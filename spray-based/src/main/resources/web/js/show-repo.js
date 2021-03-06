google.charts.setOnLoadCallback(parseURL);

function parseURL() {
    if (params.repo) showRepo(params.repo);
}

function showRepo(repo) {
    getCommitsStats(repo);
//    getContributorsStats(repo, displayContributionsCharts);
}

function getCommitsStats(repo) {
    consumeCommits(repo, function (response) {
        var committers = response.committers;
        for (let committer of committers) addToCommittersTable(committer);
        displayBestCommittersChart (response.commitsCount              );
        displayCommitsTimelineChart(response.commitsTimelineByCommitter, committers.length);
//        displayPerDayOfWeekStatsChart(latestCommits, committers     );
//        displayPerTimeOfDayStatsChart(latestCommits, committers     );
    });
}

function addToCommittersTable(committer) {
    var recognized = committer.html_url && committer.avatar_url;

    var th  = container("th", { scope: "row" }, recognized ? img(committer.avatar_url, { class: "small-img" }) : text(""));
    var td1 = simpleContainer("td", text(committer.name));
    var td2 = simpleContainer("td", recognized ? link(committer.html_url, "Link", { target: "_blank" }) : text("Unrecognized"));
    var td3 = simpleContainer("td");
    // cannot create a TextNode with a string containing an @...
    td3.innerHTML = committer.email;

    var tr = simpleContainer("tr", th, td1, td2, td3);
    if (!recognized) tr.setAttribute("class", "danger");

    var committersBody = document.getElementById("committers").tBodies[0];
    committersBody.appendChild(tr);
}

function displayBestCommittersChart(commitsCount) {
    commitsCount.unshift(new Array("Committer", "Commits"));

    var data = new google.visualization.arrayToDataTable(commitsCount);
    var chart = new google.charts.Bar(document.getElementById('bestCommittersChart'));
    var options = {
        title: 'Best committers',
        height: 30 + commitsCount.length * 40,
        backgroundColor: { fill:'transparent' },
        legend: { position: 'none' },
        bars: 'horizontal',
        axes: {
            x: { 0: { side: 'top', label: 'Commits'} },
            y: { 0: { side: 'left', label: 'Committer'} }
        },
        bar: { groupWidth: "90%" }
    };
    chart.draw(data, options);
}

function displayContributionsCharts(contributions) {
    if (!contributions[0]) return;

    var committers      = [];
    var changesOverTime = [];

    for (let week of contributions[0].weeks) changesOverTime.push([ new Date(week.w * 1000) ]);

    var lastWeekWithData = 0;
    for (let contribution of contributions) {
        committers.push(contribution.author.login);

        var weeks = contribution.weeks;
        for (var i = 0; i < weeks.length; i++) {
            changesOverTime[i].push(weeks[i]);
            if (weeks[i].a || weeks[i].d) lastWeekWithData = Math.max(lastWeekWithData, i);
        }
    }

    var computeTotalChanges     = function(week) { return week.a + week.d; };
    var computeEffectiveChanges = function(week) { return week.a - week.d; };
    var computeTotalCommits     = function(week) { return week.c         ; };

    baseDisplayContributionsOvertimeChart(changesOverTime, lastWeekWithData, computeTotalChanges, committers, "Total changes", "totalChangesOvertimeChart")
    baseDisplayContributionsOvertimeChart(changesOverTime, lastWeekWithData, computeEffectiveChanges, committers, "Total effective changes", "totalEffectiveChangesOvertimeChart")
    baseDisplayContributionsOvertimeChart(changesOverTime, lastWeekWithData, computeTotalCommits, committers, "Total commits over time", "totalCommitsOvertimeChart")

    var headers = [ "Committers", "Total contribution" ];
    baseDisplayContributionsTotalPieChart(changesOverTime, lastWeekWithData, computeTotalChanges, committers, "Total changes", headers, "totalChangesAggregatePieChart");
    baseDisplayContributionsTotalPieChart(changesOverTime, lastWeekWithData, computeTotalCommits, committers, "Total commits", headers, "totalCommitsAggregatePieChart");
}

function baseDisplayContributionsOvertimeChart(changesOverTime, lastWeekWithData, mapToInt, committers, vAxisTitle, containerId) {
    // aggregate the data
    var data = matrix(lastWeekWithData + 1, changesOverTime[0], 0);
    for (var i = 0; i < data.length; i++) {
        // the first column contains the date field
        data[i][0] = changesOverTime[i][0];
        for (var j = 1; j < changesOverTime[i].length; j++) {
            data[i][j] = mapToInt(changesOverTime[i][j]) + (i > 0 ? data[i - 1][j] : 0);
        }
    }

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("date", "Time");

    for (let committer of committers) dataTable.addColumn("number", committer);
    dataTable.addRows(data);

    var options = {
        height: 450,
        backgroundColor: { fill:'transparent' },
        hAxis: {
            title: "Time",
            format: "MMM d, y"
        },
        vAxis: {
          title: vAxisTitle
        },
        legend: { position: "bottom" }
    };

    var chart = new google.visualization.LineChart(document.getElementById(containerId));
    chart.draw(dataTable, options);
}

function baseDisplayContributionsTotalPieChart(changesOverTime, lastWeekWithData, mapToInt, committers, title, headers, containerId) {
    var data = matrix(committers.length, 2, 0);

    for (var i = 0; i < data.length; i++) data[i][0] = committers[i];
    for (var i = 0; i <= lastWeekWithData; i++) {
        for (var j = 0; j < data.length; j++) {
            // the first column contains the date, which we don't care about
            data[j][1] += mapToInt(changesOverTime[i][j + 1]);
        }
    }
    data.unshift(headers);

    var dataTable = google.visualization.arrayToDataTable(data);
    var chart     = new google.visualization.PieChart(document.getElementById(containerId));
    chart.draw(dataTable, { title: title });
}

function displayCommitsTimelineChart(commitsTimelineByCommitter, numberOfCommitters) {
    var chart     = new google.visualization.Timeline(document.getElementById('commitsTimelineChart'));
    var dataTable = new google.visualization.DataTable();

    dataTable.addColumn({ type: 'string', id: 'Committer' });
    dataTable.addColumn({ type: 'string', id: 'dummy bar label' });
    dataTable.addColumn({ type: 'string', role: 'tooltip', 'p': {'html': true} });
    dataTable.addColumn({ type: 'date', id: 'Date' });
    dataTable.addColumn({ type: 'date', id: 'Date+1' });

    var rows = new Array();
    forEntries(commitsTimelineByCommitter, function(committerAndDate) {
        forEntries(committerAndDate[1], function(dateAndCommits) {
            var committerName = committerAndDate[0];
            var day           = new Date(dateAndCommits[0]);
            var tooltip       = "<ul>" + dateAndCommits[1].map(function(commit) { return "<li><b>" + commit.date + ":</b> " + commit.message + "</li>"; }).join("") + "</ul>";
            rows.push(new Array(committerName, "", tooltip, day, day.plusDays(1)));
        });
    });

    debug(rows);
    dataTable.addRows(rows);
    chart.draw(dataTable, { height: 70 + numberOfCommitters * 41 });
}

function displayPerTimeOfDayStatsChart(commits, committers) {
    var hoursInDay = 24
    var timeOfDay  = function(time) { return {v: [time, 0, 0], f: time + " am"}; };
    displayStackedChartPerTimeRange(
        commits, committers, hoursInDay,
        function(date) { return date.getHours(); }, timeOfDay,
        "Commits throughout the day", "timeofday", "Time of day", "h:mm a", "commitsPerTimeOfDayChart",
        [0, 0, 0], [23, 0, 0]);
}

function displayPerDayOfWeekStatsChart(commits, committers) {
    var daysOfWeek = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday" ];
    var dayOfWeek  = function(index) { return daysOfWeek[index]; };
    displayStackedChartPerTimeRange(
        commits, committers, daysOfWeek.length,
        function(date) { return (date.getDay() + 6) % 7; }, dayOfWeek,
        "Commits throughout the week", "string", "Day of week", "h:mm a", "commitsPerDayOfWeekChart",
        [0, 0, 0], [23, 0, 0]);
}

function displayStackedChartPerTimeRange(commits, committers, numberOfRanges, dateToRange, rangeToObj, title, rangeType, rangeTitle, rangeFormat, containerId, minRange, maxRange) {
    var commitsPerTimeRangeAndCommitter = new Array(numberOfRanges);
    for (var i = 0; i < numberOfRanges; i++) commitsPerTimeRangeAndCommitter[i] = new Counter(committers);
    for (let commit of commits) commitsPerTimeRangeAndCommitter[dateToRange(commit.date)].inc(commit.committer.name);

    var data = [];
    for (var i = 0; i < numberOfRanges; i++) {
        var statsOfRange = [ rangeToObj(i) ];
        statsOfRange.push(...commitsPerTimeRangeAndCommitter[i].map.values());
        data.push(statsOfRange);
    }

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn(rangeType, rangeTitle);
    for (let committer of committers) dataTable.addColumn("number", committer);
    dataTable.addRows(data);

    var options = {
        title: title,
        isStacked: true,
        hAxis: { title: rangeTitle, format: rangeFormat },
        height: 500,
        backgroundColor: { fill:'transparent' },
        vAxis: { title: "Number of commits" }
    };
    if (minRange != undefined && maxRange != undefined) options.viewWindow = { min: minRange, max: maxRange };

    var chart = new google.visualization.ColumnChart(document.getElementById(containerId));
    chart.draw(dataTable, options);
}
