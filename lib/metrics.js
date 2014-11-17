
var util = require('util');

const PREFIX_COUNT  = 'count_';
const PREFIX_TIMER  = 'timing_';

var Metrics;
module.exports = function ( base ) {

    Metrics = base;
    return {
        Counter : Counter,
        Timing : Timing
    }
};

/* Common constructor routine. */
function MetricsController ( opt, prefix ) {
    if ( !opt.name ) throw 'Metrics options must have name';
    var copy = util._extend({}, opt);
    this.name = copy.name = Metrics.prefix + prefix + copy.name;
    return copy;
}

MetricsController.deleteMetrics = function (cb) {
    Metrics.transport.deleteMetrics([this.name + '*'], cb);
};

/**
 * Counter
 * @param opt
 * @constructor
 */
function Counter ( opt ) {
    var modifiedOptions = MetricsController.call(this, opt, PREFIX_COUNT);
    Metrics.collector.initCounter( modifiedOptions );
}

Counter.prototype.increment = function ( filter ) {
    Metrics.queue.push(
        Metrics.collector.count.bind(Metrics.collector, this.name, filter),
        1
    );
};

Counter.prototype.deleteMetrics = MetricsController.deleteMetrics;

/**
 * Timer
 * @param opt
 * @constructor
 */
function Timing ( opt ) {
    var modifiedOptions = MetricsController.call(this, opt, PREFIX_TIMER);
    Metrics.collector.initTiming( modifiedOptions );
}

Timing.prototype.measure = function ( time, filter ) {
    Metrics.queue.push(
        Metrics.collector.timing.bind(Metrics.collector, this.name, (Date.now() - time ), filter),
        1
    );
};

Timing.prototype.deleteMetrics = MetricsController.deleteMetrics;