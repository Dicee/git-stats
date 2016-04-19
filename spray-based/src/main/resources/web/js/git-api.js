var keywordNormalizeRegex = new RegExp("\\s+", "gm");
function searchRepository(keyword, callback, onerror) {
    callGitApi("search/repositories?q=" + keyword.trim().replace(keywordNormalizeRegex, "+"), callback, onerror);
}

function consumeCommits(repo, callback, onerror) {
    callGitStatsApi(repo + "/commits/process", callback)
}

function getContributorsStats(repo, callback, onerror) {
    callGitApi("repos/" + repo + "/stats/contributors", callback, onerror);
}

function callGitApi(endPoint, callback, onerror) {
    ajaxCall("https://api.github.com/" + endPoint, callback, onerror)
}

function callGitStatsApi(endPoint, callback, onerror) {
    ajaxCall("/git-stats-api/" + endPoint, callback, onerror)
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