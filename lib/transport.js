
var util = require('util');
var https = require('https');

function Transport ( opt ) {
    this.silent = opt.silent || true;
    this.options.hostname = 'metrics-api.librato.com';
    this.options.path = '/v1/metrics';
    this.options.auth = opt.email +':'+ opt.token;
}

module.exports = Transport;

Transport.prototype.options = {
    hostname : '',
    path : '',
    method : 'POST',
    auth : '',
    headers : {
        'Content-Type': 'application/json',
        'Content-Length': null
    }
};

Transport.prototype.postMetrics = function ( metric, cb ) {

    var isSilent = this.silent;
    var data = JSON.stringify(metric);
    this.options.headers['Content-Length'] = Buffer.byteLength(data);

    var req = https.request(this.options, function (res) {
        if ( isSilent ) cb();
        else if ( res.statusCode > 399 ) cb( res.headers );
        else cb();
    });
    req.write(data);
    req.end();
};

Transport.prototype.deleteMetrics = function ( names, cb ) {

    var isSilent = this.silent;
    var data = JSON.stringify({names : names});

    var options = util._extend({}, this.options);
    options.method = 'DELETE';
    options.headers['Content-Length'] = Buffer.byteLength(data);

    var req = https.request(options, function (res) {
        if ( isSilent ) cb();
        else if ( res.statusCode > 399 ) cb( res.headers );
        else cb();
    });
    req.write(data);
    req.end();
};