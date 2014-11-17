var async = require('async');
var path = require('path');
var assert = require('assert');
var librato = require( path.resolve(__dirname, '../../') );
var TestTransport = require(path.resolve(__dirname, '../test-transport.js'));

var request;
var result = { send : function () {} };

before(function () {
    request = {};

    librato.initialise({
        email: 'user@mail.com',
        token: 'token',
        transport: TestTransport.bind(this, function ( metric ) {
        })
    });

});

describe('Middleware', function () {

    it('use() should be correctly attached to request object', function () {
        librato.middleware.use(request, null, function () {
            assert(request.hasOwnProperty('_librato_express'));
        })
    });

    it('routeCount() should increment counter cache', function (done) {
        async.waterfall([
            librato.middleware.routeCount({name: 'test'}).bind(this, request, result),
            function ( cb ) {
                assert(librato.collector.cache.counters.hasOwnProperty('count_test'));
                var data = librato.collector.cache.counters['count_test'].data;
                assert(data['count_test'].value === 1);
                cb();
            }
        ], done)
    });

    it('routeTiming() should add timer entry to cache', function (done) {
        async.waterfall([
            librato.middleware.routeTiming({name: 'test'}).bind(this, request, result),
            function ( cb ) {
                result.send();
                cb();
            },
            function ( cb ) {
                assert(librato.collector.cache.timings.hasOwnProperty('timing_test'));
                var data = librato.collector.cache.timings['timing_test'].data;
                assert(data['timing_test'].values.length > 0);
                cb();
            }
        ], done)
    });

    it('flush() should dump cache data to transport', function (done) {

        librato.transport = new TestTransport(function ( metric, cb ) {
            assert(metric.gauges.length == 2);
            var timings = librato.collector.cache.timings['timing_test'].data['timing_test'];
            var counter = librato.collector.cache.counters['count_test'].data['count_test'];

            assert(timings.values.length == 0);
            assert(counter.value == 0);
            cb();
        });

        librato.flush(function () {
            done();
        });
    });

});