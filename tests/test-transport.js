
function TestTransport ( observer ) {
    this.observer = observer;
}
module.exports = TestTransport;

TestTransport.prototype.postMetrics = function ( metric, cb ) {
    this.observer( metric );
    cb();
};

TestTransport.prototype.deleteMetrics = function ( metric, cb ) {
    this.observer( metric );
    cb();
};