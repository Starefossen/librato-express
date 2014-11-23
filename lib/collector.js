const MS_IN_SECOND = 1000;
const DEFAULT_LIBRATO_PERIOD = 60000;

function Collector () {}
module.exports = Collector;

Collector.prototype.cache = {
    lastFlush : 0,
    counters : { keys : [] },
    timings : { keys : [] }
};

Collector.prototype.initCounter = newCacheObj.bind(Collector.prototype, 'counters');
Collector.prototype.initTiming = newCacheObj.bind(Collector.prototype, 'timings');

Collector.prototype.count = function ( key, filter, cb ) {
    var data = this.cache.counters[key].data;
    var dataKey = filter !== undefined && filter !== null ? key + '_' + filter : key;
    var item = data[ dataKey ];

    if ( !item ) {
        data.keys.push( dataKey );
        data[ dataKey ] = {
            value : 1,
            dirty : true
        };
    }
    else {
        item.value++;
        item.dirty = true;
    }

    cb();
};

Collector.prototype.timing = function ( key, duration, filter, cb ) {
    var data = this.cache.timings[key].data;
    var dataKey = filter !== undefined && filter !== null ? key + '_' + filter : key;
    var item = data[ dataKey ];

    if ( !item ) {
        data.keys.push( dataKey );
        data[ dataKey ] = {
            values : [ duration ],
            dirty : true
        };
    }
    else {
        item.values.push( duration );
        item.dirty = true;
    }

    cb();
};

Collector.prototype.flush = function ( cb ) {

    var elapsed, now = Date.now();
    elapsed = now - this.cache.lastFlush;
    this.cache.lastFlush = now;

    var gauges = [];
    var next = null;

    forAllDueToSendRecords(this.cache.counters, elapsed, function ( name, data ) {

        next = {
            name : name,
            value : data.value,
            source : data.source
        };

        gauges.push(next);
        if ( this.alert && this.alert.trigger(next) ) {
            this.alert.handler(next);
        }

        data.value = 0;
    });

    forAllDueToSendRecords(this.cache.timings, elapsed, function ( name, data ) {

        var sum = data.values.reduce(function (a, b) { return a + b; });

        next = {
            name : name,
            count : data.values.length,
            sum : sum,
            max : Math.max.apply(Math, data.values),
            min : Math.min.apply(Math, data.values),
            sum_squares : Math.pow(sum, 2),
            source : data.source
        };

        gauges.push(next);
        if ( this.alert.trigger && this.alert.trigger(next) ) {
            this.alert.handler(next);
        }

        data.values = [];
    });

    cb( gauges.length ? { gauges : gauges } : null );
};

function newCacheObj ( metricsCache, opt ) {

    var cache = this.cache[metricsCache];
    cache.keys.push( opt.name );

    var obj = {
        period : opt.period ? opt.period * MS_IN_SECOND : DEFAULT_LIBRATO_PERIOD,
        elapsed : 0,
        source : opt.source || null,
        ignoreNonDirty : opt.hasOwnProperty('ignoreNonDirty')? opt.ignoreNonDirty : true,
        alert : false,
        data : {
            keys : []
        }
    };

    if ( opt.alert &&
        typeof opt.alert['trigger'] === 'function' &&
        typeof opt.alert['handler'] === 'function' ) {

        obj.alert = {
            trigger : opt.alert.trigger,
            handler : opt.alert.handler
        }
    }

    return cache[ opt.name ] = obj;
}

function forAllDueToSendRecords ( metrics, elapsed, callback ) {

    var keys = metrics.keys;
    var data, key;
    var dataItems, item, itemKey;

    var i = keys.length;
    while( i-- ) {
        data = metrics[key = keys[i]];
        data.elapsed += elapsed;

        var isTime = data.elapsed >= data.period;
        if ( isTime ) {

            data.elapsed = 0;
            dataItems = data.data;

            var j = dataItems.keys.length;
            while( j-- ) {
                itemKey = dataItems.keys[j];
                item = dataItems[ itemKey ];

                if ( item.dirty || !data.ignoreNonDirty ) {
                    callback.call(data, itemKey, item);
                    item.dirty = false;
                }

            }

        }
    }
}