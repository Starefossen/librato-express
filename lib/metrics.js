
var path = require('path');
var async = require('async');

var Collector = require(path.resolve(__dirname, './collector.js'));
var Transport = require(path.resolve(__dirname, './transport.js'));

var Metrics = module.exports = {};

Metrics.Counter = Counter;
Metrics.Timing = Timing;

var collector = null;
var transport = null;

const PREFIX        = '';
const PREFIX_COUNT = 'count_';
const PREFIX_TIMER = 'timing_';

const MIN_LIBRATO_PERIOD = 1000;

/**
 * Configure librato-express here.
 * @param opt
 */
Metrics.initialise = function ( opt ) {

    Metrics.prefix = opt.prefix || PREFIX;
    Metrics.flushPeriod = opt.period && opt.period > MIN_LIBRATO_PERIOD ?
        opt.period : MIN_LIBRATO_PERIOD;

    transport = new Transport({
        email: opt.email,
        token: opt.token,
        silent: true
    });

    collector = new Collector();
};

var queue = async.priorityQueue(function (task, callback) {
    task(callback);
}, 50 );

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

        return _route_timer_fnc.bind(this, new Timing( options ), filter);
    }
};

/**
 * Call this function to start librato api calls interval.
 * @type {function()}
 */
Metrics.start = async.forever.bind(async, function ( next ) {

    var flushFnc = collector.flush.bind(collector);

    setTimeout(function () {

        queue.push( flushFnc, 0, function ( data ) {
            if ( data ) {
                transport.send(data, next);
            }
            else {
                next();
            }
        });

    }, Metrics.flushPeriod );

}, function doNothing () {} );

/**
 * Counter
 * @param opt
 * @constructor
 */
function Counter ( opt ) {
    validateMetricsOptions(opt);
    this.name = opt.name = Metrics.prefix + PREFIX_COUNT + opt.name;
    collector.initCounter(opt);
}

Counter.prototype.increment = function ( filter ) {
    queue.push( collector.count.bind(collector, this.name, filter), 1 );
};

/**
 * Timer
 * @param opt
 * @constructor
 */
function Timing ( opt ) {
    validateMetricsOptions(opt);
    this.name = opt.name = Metrics.prefix + PREFIX_TIMER + opt.name;
    collector.initTiming(opt);
}

Timing.prototype.measure = function ( time, filter ) {
    queue.push( collector.timing.bind(collector, this.name, (Date.now() - time ), filter), 1);
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