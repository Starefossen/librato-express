/**
 * Created by Dmitry on 11/17/2014.
 */

var path = require('path');
var assert = require('assert');
var librato = require( path.resolve(__dirname, '../../') );
var TestTransport = require(path.resolve(__dirname, '../test-transport.js'));

before(function () {

    librato.initialise({
        email: 'user@mail.com',
        token: 'token'
    });

    librato.transport = new TestTransport(function ( metric, cb ) {
        cb();
    });
});

describe('Deleting', function () {

    it('all metrics should generate correct search string', function ( done ) {

        librato.transport = new TestTransport(function ( metric, cb ) {
            console.log(metric);
            cb();
        });

        assert(false, 'not implemented');
        done();
    });

    it('on per metric basis should generate correct search string', function () {
        assert(false, 'not implemented');
    });

});