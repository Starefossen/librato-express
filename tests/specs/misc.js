/**
 * Created by Dmitry on 11/17/2014.
 */

var path = require('path');
var assert = require('assert');
var librato = require( path.resolve(__dirname, '../../') );
var TestTransport = require(path.resolve(__dirname, '../test-transport.js'));

before(function () {

    librato.initialise({
        email : 'dmitrymatveev@yahoo.co.nz',
        token : 'a9264b918bbaf4841bc56a84abbec87c3087fb2d878c8e0f6761624b842a7f47'
    });
});

describe('Deleting', function () {

    it('all metrics', function ( done ) {

        librato.transport = new TestTransport(function ( metric, cb ) {
            console.log(metric);
            cb();
        });

        assert(false, 'not implemented');
        done();
    })

});