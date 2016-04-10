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

function debug(...args) { console.log(...args.map(JSON.stringify)); }

function Counter(keys) {
    this.map = {};
    if (keys) {
        for (let key of keys) this.map[key] = 0;
    }

    this.count = function (key) { return this.map[key] == undefined ? 0 : this.map[key]; };
    this.add   = function(key, n) {
        var count = this.count(key) + n;
        this.map[key] = count;
        return count;
    }
    this.inc      = function(key) { return this.add(key, 1); };
    this.keys     = function()    { return Object.keys(this.map); };
    this.values   = function()    {
        var counter = this;
        return this.keys().map(function (key) { return counter.count(key); });
    }
    this.entries  = function() {
        var counter = this;
        return this.keys().map(function (key) { return [ key, counter.count(key) ]; });
    };
    this.toString = function() { return JSON.stringify(this.map); };
}

function RichMap() {
    var richMap = this;

    this.map = {};

    this.get         = function(key)        { return this.map[key]                ; };
    this.put         = function(key, value) { this.map[key] = value;              ; };
    this.containsKey = function(key)        { return this.map.hasOwnProperty(key) ; };
    this.keys        = function()           { return Object.keys   (this.map)     ; };
    this.toString    = function()           { return JSON.stringify(this.map)     ; };

    this.entries = function() { return this.keys().map(function (key) { return [ key, richMap.get(key) ]; }); };
    this.values  = function() { return this.keys().map(function (key) { return        richMap.get(key)  ; }); };

    this.getOrElse   = function(key, fallback) { return this.get(key) === undefined ? fallback : this.get(key); };
    this.putIfAbsent = function(key, value) {
        if (this.get(key) !== undefined) return this.get(key);
        this.put(key, value);
        return value;
    };
}