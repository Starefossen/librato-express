var async = require('async');
var path = require('path');
var assert = require('assert');
var librato = require( path.resolve(__dirname, '../../') );
var TestTransport = require(path.resolve(__dirname, '../test-transport.js'));

describe('Metrics', function () {

    it('counter increment', function () {
        assert(false, 'not implemented');
    });

});