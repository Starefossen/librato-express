
var util = require('util');
var path = require('path');
var async = require('async');

var Collector = require(path.resolve(__dirname, './collector.js'));
var Transport = require(path.resolve(__dirname, './transport.js'));

var Metrics = module.exports = {};

Metrics.Counter = Counter;
Metrics.Timing = Timing;

Metrics.queue = null;
var collector = Metrics.collector;
var transport = Metrics.transport;

const PREFIX        = '';
const PREFIX_COUNT  = 'count_';
const PREFIX_TIMER  = 'timing_';

const MIN_LIBRATO_PERIOD = 1000;

Metrics.queue = async.priorityQueue(function (task, callback) {
    task(callback);
}, 50 );

/**
 * Configure librato-express here.
 * @param opt
 */
Metrics.initialise = function ( opt ) {

    Metrics.prefix = opt.prefix || PREFIX;
    Metrics.flushPeriod = opt.period && opt.period > MIN_LIBRATO_PERIOD ?
        opt.period : MIN_LIBRATO_PERIOD;

    transport = Metrics.transport = new Transport({
        email: opt.email,
        token: opt.token,
        silent: true
    });

    collector = Metrics.collector = new Collector();
    collector.flush = collector.flush.bind(collector);
};

/**
 * Express middleware functions. Use these to hook into URL routes.
 * @type {{use: Function, routeCount: Function, routeTiming: Function}}
 */
Metrics.middleware = {

    use : function ( req, res, next ) {
        req._librato_express = Date.now();
        next();
    },

    routeCount : function ( options, filter ) {

        var type = typeof filter;
        if ( type === "string" ) filter = _default_filter.bind(this, filter.match(/(\w+)/g) );
        else if ( type === "function" ) filter = _filter_proxy.bind(this, filter);

        return _route_count_fnc.bind(this, new Counter(options), filter);
    },

    routeTiming : function ( options, filter ) {

        var type = typeof filter;
        if ( type === "string" ) filter = _default_filter.bind(this, filter.match(/(\w+)/g) );
        else if ( type === "function" ) filter = _filter_proxy.bind(this, filter);

        return _route_timer_fnc.bind(this, new Timing(options), filter);
    }
};

/**
 * Call this function to start librato api calls interval.
 * @type {function()}
 */
Metrics.start = async.forever.bind(async, function ( next ) {
    setTimeout(
        Metrics.flush.bind(this, next),
        Metrics.flushPeriod
    );
});

/**
 * Schedule a job to send out metrics manually.
 */
Metrics.flush = function ( cb ) {
    Metrics.queue.push(Metrics.collector.flush, 0, function ( data ) {
        if ( data ) transport.send(data, cb);
        else cb();
    });
};

/**
 * Counter
 * @param opt
 * @constructor
 */
function Counter ( opt ) {
    validateMetricsOptions(opt);
    var copy = util._extend({}, opt);
    this.name = copy.name = Metrics.prefix + PREFIX_COUNT + copy.name;
    collector.initCounter(copy);
}

Counter.prototype.increment = function ( filter ) {
    Metrics.queue.push( collector.count.bind(collector, this.name, filter), 1 );
};

/**
 * Timer
 * @param opt
 * @constructor
 */
function Timing ( opt ) {
    validateMetricsOptions(opt);
    var copy = util._extend({}, opt);
    this.name = copy.name = Metrics.prefix + PREFIX_TIMER + copy.name;
    collector.initTiming(copy);
}

Timing.prototype.measure = function ( time, filter ) {
    Metrics.queue.push( collector.timing.bind(collector, this.name, (Date.now() - time ), filter), 1);
};

// ==========================================================
// Helper functions
// ==========================================================

function validateMetricsOptions ( opt ) {
    if ( !opt.name ) throw 'Metrics options must have name';
}

function _route_count_fnc ( counter, filter, req, res, next ) {
    counter.increment( filter ? filter(req) : null );
    if ( next ) next();
}

function _route_timer_fnc ( timing, filter, req, res, next ) {
    var _send = res.send;
    res.send = function () {
        res.send = _send;
        res.send.apply(this, arguments);
        timing.measure(req._librato_express, filter ? filter(req) : null );
    };
    if ( next ) next();
}

function _filter_proxy ( filter, req ) {
    return filter(req);
}

function _default_filter ( filter, req ) {
    var res = req[ filter[0] ];
    for(var i = 1, len = filter.length; i < len; i++) {
        res = res[ filter[i] ];
    }
    return res;
}