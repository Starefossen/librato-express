
var Metrics;
module.exports = function ( base ) {
    Metrics = base;
    return Annotation;
};

const MS_IN_SEC = 1000;

function Annotation ( stream, opt ) {

    this.options = {};
    opt = opt ? opt : {};

    this.stream = stream;
    this.options.title = opt.title || stream;

    this.options.source = opt.source || null;
    this.options.description = opt.description || null;
    this.options.links = opt.links || null;

    this.options.start_time = null;
    this.options.end_time = null;
}

Annotation.prototype.startMs = function (time) {
    return this.options.start_time = (time || Date.now()) / MS_IN_SEC;
};

Annotation.prototype.endMs = function (time) {
    return this.options.end_time = (time || Date.now()) / MS_IN_SEC;
};

Annotation.prototype.post = function (cb) {
    Metrics.transport.postAnnotation(this.stream, this.options, cb);
    this.options.start_time = null;
    this.options.end_time = null;
};

