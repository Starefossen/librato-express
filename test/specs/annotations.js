var async = require('async');
var path = require('path');
var assert = require('assert');
var librato = require( path.resolve(__dirname, '../../') );
var TestTransport = require(path.resolve(__dirname, '../test-transport.js'));

describe('Annotations', function () {

    it('object', function (done) {

        librato.initialise({
            email: 'user@mail.com',
            token: 'token',
            transport: TestTransport.bind(this, function (stream, metric) {
                assert(stream === 'test-stream');
                assert(metric.title === 'annotation');
                assert(metric.source === 'test-source');
                assert(metric.description === 'this is a test annotation');
                assert(metric.hasOwnProperty('links'));
                assert(metric.links.length === 2);
                done();
            })
        });

        var ann = new librato.Annotation('test-stream', {
            title : 'annotation',
            source : 'test-source',
            description : 'this is a test annotation',
            links : ['foo', 'boo']
        });

        ann.post(function () {});

    });

    it('start and end timestamps', function (done) {

        var start_time = 0;
        var end_time = 0;

        librato.initialise({
            email: 'user@mail.com',
            token: 'token',
            transport: TestTransport.bind(this, function (stream, metric) {
                assert(metric.start_time === start_time);
                assert(metric.end_time === end_time);
                done();
            })
        });

        var ann = new librato.Annotation('test-stream', {
            title : 'annotation'
        });

        start_time = ann.startMs();
        end_time = ann.endMs();

        ann.post(function () {});
    })

});