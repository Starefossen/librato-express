/**
 * Created by Dmitry on 11/17/2014.
 */

var path = require('path');
var assert = require('assert');
var librato = require( path.resolve(__dirname, '../../') );
var TestTransport = require(path.resolve(__dirname, '../test-transport.js'));

describe('Deleting', function () {

    it('all metrics should generate correct search string', function ( done ) {

        librato.initialise({
            email: 'user@mail.com',
            token: 'token',
            prefix: 'prefix_',
            transport: TestTransport.bind(this, function ( metric ) {
                assert(metric.hasOwnProperty('names'));
                assert(metric.names[0] === 'prefix_*');
            })
        });

        librato.deleteAllMetrics(done);
    });

    it('metric should generate correct search string', function (done) {

        librato.initialise({
            email: 'user@mail.com',
            token: 'token',
            prefix: 'prefix_',
            transport: TestTransport.bind(this, function ( metric ) {
                assert(metric.names[0] === 'prefix_count_test*');
            })
        });

        var metric = new librato.Counter({
            name: 'test'
        });

        metric.deleteMetrics(done);
    });

});