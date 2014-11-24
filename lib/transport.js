
var path = require('path');
var util = require('util');
var https = require('https');
var pack = require(path.resolve(__dirname, '../package.json'));

var postOptions = {
    hostname : '',
    path : '',
    method : 'POST',
    auth : '',
    headers : {
        'User-Agent': 'librato-express/'+ pack.version,
        'Content-Type': 'application/json',
        'Content-Length': null
    }
};

function Transport ( opt ) {
    this.silent = opt.silent || true;

    postOptions.hostname = 'metrics-api.librato.com';
    postOptions.path = '/v1/metrics';
    postOptions.auth = opt.email +':'+ opt.token;
}

module.exports = Transport;

// Special function to reduce garbage collection
Transport.prototype.postMetrics = function (metric, cb) {
    httpsRequest.call(this, postOptions, metric, cb)
};

Transport.prototype.deleteMetrics = function (data, cb) {
    var options = util._extend({}, postOptions);
    options.method = 'DELETE';
    httpsRequest.call(this, options, data, cb)
};

Transport.prototype.postAnnotation = function (stream, data, cb) {
    var options = util._extend({}, postOptions);
    options.path = '/v1/annotations/' + stream;
    httpsRequest.call(this, options, data, cb);
};

function httpsRequest (options, data, cb) {
    var silent = this.silent;
    var obj = JSON.stringify(data);
    options.headers['Content-Length'] = Buffer.byteLength(obj);
    var req = https.request(options, function (res) {
        if (!cb) return;
        if ( silent ) cb();
        else if ( res.statusCode > 399 ) cb( res.headers );
        else cb();
    });
    req.write(obj);
    req.end();
}