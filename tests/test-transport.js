
function TestTransport ( observer ) {
    this.observer = observer;
}
module.exports = TestTransport;

TestTransport.prototype.send = function ( metric, cb ) {
    this.observer( metric );
    cb();
};
