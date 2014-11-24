
function TestTransport ( observer ) {
    this.observer = observer;
}
module.exports = TestTransport;

TestTransport.prototype.postMetrics = callObserver;
TestTransport.prototype.deleteMetrics = callObserver;
TestTransport.prototype.postAnnotation = callObserver;

function callObserver () {
    var args = Array.prototype.slice.call(arguments);
    var cb = args.splice(args.length - 1, args.length)[0];
    this.observer.apply(this, args);
    cb();
}