var async = require('async');
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

describe('Metrics', function () {

    it('counter increment', function () {
        assert(false, 'not implemented');
    });

});