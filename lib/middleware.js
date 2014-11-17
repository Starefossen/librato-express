/**
 * Created by Dmitry on 11/17/2014.
 */

/**
 * Express middleware functions. Use these to hook into URL routes.
 * @type {{use: Function, routeCount: Function, routeTiming: Function}}
 */
module.exports = function ( Metrics ) {

    return {

        use : function ( req, res, next ) {
            req._librato_express = Date.now();
            next();
        },

        routeCount : function ( options, filter ) {

            var type = typeof filter;
            if ( type === "string" ) filter = _default_filter.bind(this, filter.match(/(\w+)/g) );
            else if ( type === "function" ) filter = _filter_proxy.bind(this, filter);

            return _route_count_fnc.bind(this, new Metrics.Counter(options), filter);
        },

        routeTiming : function ( options, filter ) {

            var type = typeof filter;
            if ( type === "string" ) filter = _default_filter.bind(this, filter.match(/(\w+)/g) );
            else if ( type === "function" ) filter = _filter_proxy.bind(this, filter);

            return _route_timer_fnc.bind(this, new Metrics.Timing(options), filter);
        }
    };
};

// ==========================================================
// Helper functions
// ==========================================================

function _route_count_fnc ( counter, filter, req, res, next ) {
    counter.increment( filter ? filter(req) : null );
    if ( next ) next();
}

function _route_timer_fnc ( timing, filter, req, res, next ) {
    var _send = res.send;
    res.send = function () {
        res.send = _send;
        res.send.apply(this, arguments);
        timing.measure(req._librato_express, filter ? filter(req) : null );
    };
    if ( next ) next();
}

function _filter_proxy ( filter, req ) {
    return filter(req);
}

function _default_filter ( filter, req ) {
    var res = req[ filter[0] ];
    for(var i = 1, len = filter.length; i < len; i++) {
        res = res[ filter[i] ];
    }
    return res;
}