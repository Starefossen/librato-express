var async = require('async');
var path = require('path');
var assert = require('assert');
var librato = require( path.resolve(__dirname, '../../') );
var TestTransport = require(path.resolve(__dirname, '../test-transport.js'));

describe('Counter Metrics', function () {

    this.slow(1500);
    this.timeout(2000);

    it('increment', function (done) {

        librato.initialise({
            email: 'user@mail.com',
            token: 'token',
            transport: TestTransport.bind(this, function ( metric ) {
                assert(metric.hasOwnProperty('gauges'));
                assert(metric.gauges.length === 1);
                assert(metric.gauges[0].name === 'count_test-counter');
                assert(metric.gauges[0].value === 2);
                done();
            })
        });

        var counter = new librato.Counter({
            name : 'test-counter'
        });

        counter.increment();
        counter.increment();

        setTimeout(function () {
            librato.flush(function () {});
        }, 500);
    });

    it('increment filtered', function (done) {
        librato.initialise({
            email: 'user@mail.com',
            token: 'token',
            transport: TestTransport.bind(this, function ( metric ) {
                assert(metric.hasOwnProperty('gauges'));
                assert(metric.gauges.length === 2);

                var gauges = metric.gauges;
                for(var key in gauges) {
                    if (gauges.hasOwnProperty(key) && key === 'count_test-counter_filtered') {
                        assert(gauges[key].value === 2);
                    }
                }

                done();
            })
        });

        var counter = new librato.Counter({
            name : 'test-counter',
            period : 1
        });

        counter.increment();
        counter.increment('filtered');
        counter.increment('filtered');

        setTimeout(function () {
            librato.flush(function () {});
        }, 500);

    });

});