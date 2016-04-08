var keywordNormalizeRegex = new RegExp("\\s+", "gm");
function searchRepository(keyword, callback) {
    callGitApi("search/repositories?q=" + keyword.trim().replace(keywordNormalizeRegex, "+"), callback);
}

function consumeCommits(repo, commitConsumer, limit) {
    consumeCommitsRec(repo, 1, commitConsumer, limit == undefined ? Number.MAX_SAFE_INTEGER : limit);
}

function consumeCommitsRec(repo, pageIndex, commitConsumer, limit) {
    if (pageIndex > limit) return;
    getCommitsPage(repo, pageIndex, function(commits, eof) {
        for (var i = 0; i < commits.length; i++) commitConsumer(commits[i], eof && i == commits.length - 1);
        if (!eof) consumeCommitsRec(repo, pageIndex + 1, commitConsumer);
    });
}

function getCommitsPage(repo, pageIndex, callback) {
    var expectedCommits = 250;
    callGitApi("repos/" + repo + "/commits?per_page=" + expectedCommits + "&page=" + pageIndex, function(commits) {
        callback(commits, commits.length < expectedCommits);
    });
}

function getContributorsStats(repo, callback) {
    callGitApi("repos/" + repo + "/stats/contributors", callback);
}

function callGitApi(endPoint, callback) {
    ajaxCall("https://api.github.com/" + endPoint, callback)
}

function ajaxCall(url, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", url, true);
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            callback(JSON.parse(xhttp.responseText));
        } else if (xhttp.status == 404 || xhttp.status == 403) {
            alert("Error while talking to a distant server: " + JSON.parse(xhttp.responseText));
        } else if (xhttp.status == 202) {
            setTimeout(function() { ajaxCall(url, callback); }, 50)
        }
    };
    xhttp.send();
}
