var async = require('async');
var path = require('path');
var assert = require('assert');
var librato = require( path.resolve(__dirname, '../../') );
var TestTransport = require(path.resolve(__dirname, '../test-transport.js'));

describe('Counter Metrics', function () {

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

        librato.start();
    });

    it('increment filtered', function () {
        assert(false, 'not implemented');
    });

});