var async = require('async');
var path = require('path');
var assert = require('assert');
var librato = require( path.resolve(__dirname, '../../') );
var TestTransport = require(path.resolve(__dirname, '../test-transport.js'));

before(function () {

    librato.initialise({
        email: 'user@mail.com',
        token: 'token',
        transport: TestTransport.bind(this, function ( metric ) {
        })
    });
});

describe('Metrics', function () {

    it('counter increment', function () {
        assert(false, 'not implemented');
    });

});