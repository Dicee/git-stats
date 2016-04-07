// parse url parameters
var params = {};
location.search.substr(1).split("&").forEach(function(item) { var keyValue = item.split("="); params[keyValue[0]] = keyValue[1]; });

function displayResponse(response) { 
    console.log("Response: ", response);
    document.getElementById("node").innerHTML = JSON.stringify(response);
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
        }
    };
    xhttp.send();
}

Date.prototype.plusDays = function(days) {
    var copy = this.copy();
    copy.setDate(this.getDate() + days);
    return copy;
};

Date.prototype.roundToDay = function() {
    var copy = this.copy();
    copy.setUTCHours       (0);
    copy.setUTCMinutes     (0);
    copy.setUTCSeconds     (0);
    copy.setUTCMilliseconds(0);
    return copy;
};

Date.prototype.copy = function() {
    return new Date(this.getTime());
};

function debug(anything) { console.log(JSON.stringify(anything)); }

function Counter(keys) {
    this.map = new Map();
    if (keys) {
        for (let key of keys) this.map.set(key, 0);
    }

    this.count = function (key) { return this.map.get(key) == undefined ? 0 : this.map.get(key); };
    this.add   = function(key, n) {
        var count = this.count(key) + n;
        this.map.set(key, count);
        return count;
    }
    this.inc = function(key) { return this.add(key, 1); }
}