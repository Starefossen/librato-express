# Librato Express
[Librato](https://www.librato.com/) metrics client.

Along with classes that expose core functions, it comes with [expressjs](http://expressjs.com/) middleware hooks.

#### Middleware example
```javascript
var metrics = require('librato-express');
var app = require( 'express' )();

// have to pass on librato credentials
metrics.initialise({
    email : libratouser@somemail.com
    token : 'libratoGeneratedToken'
});

metrics.start();

// make sure request object has the property we want
app.param('userID', function (req, res, next, value) {
	req.userID = value;
});

// don't forget let librato-express do its thing on the stack
app.use('/', metrics.middleware.use);

// call metrics functions on desired routes
app.use('/', [
	...
	metrics.middleware.routeCount({name: 'visit'}),
	...
]);

app.use('/users/:userID', [
	metrics.middleware.routeTiming({name: 'view_user'}, 'userID'),
	...
]);
```

#### Stand-alone example
```javascript
var metrics = require('librato-express');
var counter = new metrics.Counter({name: 'some_function_call'});

metrics.initialise({
    email : libratouser@somemail.com
    token : 'libratoGeneratedToken'
});
metrics.start();

function doSomething () {
	counter.increment();
	...
}
```

## Download

	npm install librato-express


## Documentation

#### Base

* [`Metrics.initialise`](#main)
* [`Metrics.flush`](#main)
* [`Metrics.start`](#main)
* [`Metrics.deleteAllMetrics`](#main)

#### Middleware

* [`Metrics.middleware.use`](#use)
* [`Metrics.middleware.routeCount`](#routeCount)
* [`Metrics.middleware.routeTiming`](#routeTiming)

#### Metrics Classes

* [`Metrics.Counter`](#counter)
* [`Metrics.Timing`](#timing)

#### Worker Classes

* [`Collector`](#collector)
* [`Transport`](#transport)

## Base

<a name="main" />
### metrics.initialise(options)
Setup librato-express module using this function. It should be called before anything else.

* `options.email` - Librato account email.
* `options.token` - Librato provided token.
* `options.period`  - Minimum frequency of sending librato metrics. Defaults to 1 second.
* `options.prefix` - Prefix to be used with all metric names. Defaults to empty string.

It is possible to replace default implementation of parts of librato-express.
* `options.collector` - [`Caching object`](#collector) responsible for temporary storing metrics
before sending those to Librato.
* `options.transport` - [`Https client`](#transport).

### metrics.flush()
Dumps accumulated data to Librato.

### metrics.start()
Starts calling `metrics.flush()` function in a forever circle.

### metrics.deleteAllMetrics()
Deletes all metrics from Librato that start with `Base.options.prefix`. Note:
 If
prefix was not specified this method will delete __all__ metrics from the
account.

## Middleware

<a name="use" />
### use()

Attaches necessary tracking properties to the request object. This needs to be set for express to be before any other routing metrics are utilised.

<a name="routeCount" />
### routeCount(options[, filter])

Creates middleware function that when invoked by express router will increment a metric with a specified name.

* `options.name` - Name of the metric for Librato. Note: `options.prefix`
will be applied to this value.
* `options.period` - Period of sending this metric to Librato. Defaults to Librato default period of 60 seconds.
* `options.source` - Librato source name for this metric.
* `options.ignoreNonDirty` - If set will prevent sending to Librato if this metric did not increment. Defaults to `true`.
* `options.alert` - Object describing custom alert definition. Note that this is not a [Librato Alert](http://dev.librato.com/v1/alerts).
	* `alert.trigger(metric)` - Function accepting metric object which is about to be sent to Librato. Must return a boolean value to trigger an alert hook.
	* `alert.handler(metric)` - This function will be called if trigger returned `true` value.
* `filter` - This is a __postfix__ to apply to metric name. Can be either a
`string` or a
`function`.
	* _String_ - matches property in the `request` object for the route. It can be delimited with any non-word character to match property in the nested object. Note that no type checks are performed and is solely up to a client to make sure references are present.
	* _Function_ - will receive `request` object for the route and should return a string value representing a filter key.  Returned value of`null` will cause the filter to be ignored.

```javascript
// Make sure request object has 'userID' property.
app.param('userID', function (req, res, next, value) {
	req.userID = value;
});

// Will increment metric key of "count_visit_someUserID".
app.use('/', metrics.middleware.routeCount({name: 'visit'}), 'userID');

// Will increment metric key of "count_check_MY_FILTER".
app.use('/', .middleware.routeCount({name: 'check'}, function ( request ) {
	return 'MY_FILTER';
}));
```


<a name="routeTiming" />
### routeTiming(options[, filter])

Same as [`routeCount`](#routeCount) but will aggregate the delay values into a [gauge specific parameters](http://dev.librato.com/v1/post/metrics) set.

* count
* min
* max
* sum_squares

## Metrics Classes

These two objects can be used outside middleware to perform same tasks (in fact that is what middleware functions use under the hood).

<a name="counter" />
### Counter(options)
Creates a new `Counter` object. `Options` are the same as in [`routeCount`](#routeCount)

#### increment([filter])
Increment counter value.
* `filter` - Optional string value to append to metric name key.

#### deleteMetrics()
Deletes all metrics from Librato that start with the name of this metric
class instance.

<a name="timing" />
### Timing(options)
Creates a new `Timing` object. `Options` are the same as in [`routeCount`](#routeCount)

#### measure(time[, filter])
Increment counter value.
* `time` - Time in the past to take the measurement from.
* `filter` - Same as in `Counter.increment`.

#### deleteMetrics()
Same as `Counter.deleteMetrics`.


## Worker Classes

<a name="collector" />
### Collector()
Provides routines to temporary store and process metrics before sending to
Librato.

#### count(key, filter, callback)
Increment count values.

* `key` - name of Librato metric.
* `filter` - filter to apply to name.
* `callback()` - callback function.

#### timing(key, duration, filter, callback)
Add to duration values.

* `key` - name of Librato metric.
* `duration` - next duration to log.
* `filter` - filter to apply to name.
* `callback()` - callback function.

#### flush(callback)
Dump accumulated data.

* `callback({})` - Call this when finished with the metrics data object. Note: librato-express will ignore if `null` and `undefined` values.


<a name="transport" />
### Transport(options)
Simple HTTPS client to send data over network.

* `options.email` - Librato account email.
* `options.token` - Librato provided token.
* `options.silent` - Flag to never pass connection information to callee.

#### postMetrics(metric, callback)
Send metric data to librato.

* `metric` - Actual data to send.
* `callback([err])` - callback function.

#### deleteMetrics(names, callback)
Delete metrics from librato.

* `names` - list of name strings to send.
* `callback([err])` - callback function.