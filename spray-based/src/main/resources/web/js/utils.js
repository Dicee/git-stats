// parse url parameters
var params = {};
location.search.substr(1).split("&").forEach(function(item) { var keyValue = item.split("="); params[keyValue[0]] = keyValue[1]; });

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

function matrix(n, m, defaultValue) {
    return Array.from({length: n}, _ => Array(m).fill(defaultValue));
}

function debug(...args) { console.log(...args.map(function(x) { return x.debug !== undefined ? x.debug() : JSON.stringify(x); })); }

function forEntries(object, consumer) {
    if (!consumer) return;
    for (let key of Object.keys(object)) consumer([ key, object[key] ]);
}

function Counter(keys) {
    this.map = new RichMap();
    if (keys) {
        for (let key of keys) this.map.put(key, 0);
    }

    this.count = function (key) { return this.map.getOrElse(key, 0); };
    this.add   = function(key, n) {
        var count = this.count(key) + n;
        this.map.put(key, count);
        return count;
    }
    this.inc      = function(key) { return this.add(key, 1)   ; };
    this.keys     = function()    { return this.map.keys    (); };
    this.values   = function()    { return this.map.values  (); };
    this.entries  = function()    { return this.map.entries (); };
    this.toString = function()    { return this.map.toString(); };
    this.debug    = function()    { return this    .toString(); };
}