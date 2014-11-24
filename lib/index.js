/**
 * Created by Dmitry on 11/17/2014.
 */

var path = require('path');
var async = require('async');

var Metrics = module.exports = {};
var Collector = require(path.resolve(__dirname, './collector.js'));
var Transport = require(path.resolve(__dirname, './transport.js'));

var controllers = require(path.resolve(__dirname, 'metrics.js'))(Metrics);
var annotation = require(path.resolve(__dirname, 'annotation'))(Metrics);

Metrics.Counter = controllers.Counter;
Metrics.Timing = controllers.Timing;
Metrics.Annotation = annotation;

Metrics.middleware = require(path.resolve(__dirname, 'middleware.js'))(Metrics);

const PREFIX        = '';
const MIN_LIBRATO_PERIOD = 1000;

var collector;
var transport;

Metrics.queue = async.priorityQueue(function (task, callback) {
    task(callback);
}, 50 );

/**
 * Configure librato-express here.
 * @type {function()}
 * @param opt
 */
Metrics.initialise = function ( opt ) {

    Metrics.prefix = opt.prefix || PREFIX;
    Metrics.flushPeriod = opt.period && opt.period > MIN_LIBRATO_PERIOD ?
        opt.period : MIN_LIBRATO_PERIOD;

    transport = Metrics.transport = new (opt.transport || Transport)({
        email: opt.email,
        token: opt.token,
        silent: true
    });

    collector = Metrics.collector = new (opt.collector || Collector)();
    collector.flush = collector.flush.bind(collector);
};

/**
 * Schedule a job to send out metrics manually.
 * @type {function()}
 */
Metrics.flush = function ( cb ) {
    Metrics.queue.push(collector.flush, 0, function ( data ) {
        if ( data ) transport.postMetrics(data, cb);
        else cb();
    });
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
 * Sends DELETE request to librato.
 * @param cb
 */
Metrics.deleteAllMetrics = function ( cb ) {
    transport.deleteMetrics({names : [ Metrics.prefix + '*']}, cb);
};