var keywordNormalizeRegex = new RegExp("\\s+", "gm");
function searchRepository(keyword, callback, onerror) {
    callGitApi("search/repositories?q=" + keyword.trim().replace(keywordNormalizeRegex, "+"), callback, onerror);
}

function consumeCommits(repo, commitConsumer, onerror, limit = 10) {
    consumeCommitsRec(repo, 1, commitConsumer, onerror, limit);
}

function consumeCommitsRec(repo, pageIndex, commitConsumer, onerror, limit) {
    if (pageIndex > limit) return;
    getCommitsPage(repo, pageIndex, function(commits, eof) {
        for (var i = 0; i < commits.length; i++) commitConsumer(extractBestPossibleCommitInfo(commits[i]), eof && i == commits.length - 1);
        if (!eof) consumeCommitsRec(repo, pageIndex + 1, commitConsumer, onerror, limit);
    }, onerror);
}

function getCommitsPage(repo, pageIndex, callback, onerror) {
    var expectedCommits = 100;
    callGitApi("repos/" + repo + "/commits?per_page=" + expectedCommits + "&page=" + pageIndex, function(commits) {
        callback(commits, commits.length < expectedCommits);
    });
}

function extractBestPossibleCommitInfo(commitJSON) {
    var commitNode = commitJSON.commit;
    var author     = commitNode.author;
    var committer  = commitNode.committer;
    return {
        committer: {
            name      : (commitJSON.author && commitJSON.author.login) || author.name  || committer.name || "Unknown user",
            email     : author.email || committer.email,
            html_url  : (commitJSON.author && commitJSON.author.html_url) || (commitJSON.committer && commitJSON.committer.html_url),
            avatar_url: (commitJSON.author && commitJSON.author.avatar_url) || (commitJSON.committer && commitJSON.committer.avatar_url)
        },
        message: commitNode.message,
        date   : new Date(author.date || committer.date)
    };
}

function getContributorsStats(repo, callback, onerror) {
    callGitApi("repos/" + repo + "/stats/contributors", callback, onerror);
}

function callGitApi(endPoint, callback, onerror) {
    ajaxCall("https://api.github.com/" + endPoint, callback, onerror)
}

function ajaxCall(url, callback, onerror) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", url, true);
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            callback(JSON.parse(xhttp.responseText));
        } else if (xhttp.status == 202) {
            setTimeout(function() { ajaxCall(url, callback, onerror); }, 50)
        } else if (xhttp.readyState == 4) {
            (onerror ? onerror : defaultOnerror)(JSON.parse(xhttp.responseText));
        }
    };
    xhttp.send();
}

function defaultOnerror(response)  {
    var alerts = document.getElementById("alerts");
    var error  = JSON.stringify(response, null, 4);

    if (!alerts) {
        console.error(error);
        return;
    }

    while(alerts.firstChild) alerts.removeChild(alerts.firstChild);

    var alert = document.createElement("div");
    alert.setAttribute("class", "alert alert-danger");
    alert.setAttribute("role", "alert");
    alert.innerHTML = "<strong>Error: </strong> Error while contacting a distant server: " + error;

    alerts.appendChild(alert);
}