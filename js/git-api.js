function callGitApi(endPoint, callback) {
    ajaxCall("https://api.github.com/" + endPoint, callback)
}

function ajaxCall(url, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", url, true);
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            callback(JSON.parse(xhttp.responseText));
        }
    };
    xhttp.send();
}