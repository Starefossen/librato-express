# Librato Express
Middleware for expressjs to send metrics to [Librato](https://www.librato.com/).

Librato Express is a Librato Metrics client. It can be used both as [expressjs](http://expressjs.com/)
middleware and stand-alone.

#### Middleware example
```javascript
var metrics = require('librato-express');
var app = require( 'express' )();

metrics.initialise({
    email : libratouser@somemail.com
    token : 'libratoGeneratedToken'
});

metrics.start();

app.param('userID', function (req, res, next, value) {
	req.userID = value;
});

app.use('/', metrics.middleware.use);
app.use('/', [
	metrics.middleware.routeCount({name: 'visit'}),
	...
]);

app.use('/users/:userID', [
	metrics.middleware.routeCount({name: 'view_user'}, 'userID'),
	...
]);
```

#### Stand-alone example
```javascript
var metrics = require('librato-express');
var counter = new metrics.Counter({name: 'count_function_call', perido: 10});

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

#### Global

* [`Metrics.initialise`](#main)
* [`Metrics.flush`](#main)
* [`Metrics.start`](#main)

#### Middleware
* [`Metrics.middleware.use`](#use)
* [`Metrics.middleware.routeCount`](#routeCount)
* [`Metrics.middleware.routeTiming`](#routeTiming)

#### Metrics Objects

* [`Metrics.Counter`](#counter)
* [`Metrics.Timing`](#timing)

## Global

<a name="main" />
### metrics.initialise(options)
Setup librato-express module using this function. It should be called before anything else.

__Attributes__
* `options.email` - Librato account email.
* `options.token` - Librato provided token.
* `options.period`  - Minimum frequency of sending librato metrics. Defaults to 1 second.
* `options.prefix` - Prefix to be used with all metric names. Defaults to empty string.

### metrics.flush()
Dumps accumulated data to Librato.

### metrics.start()
Starts calling `metrics.flush()` function in a forever circle.

## Middleware

<a name="use" />
### use()

Attaches necessary tracking properties to the request object. This needs to be set for express to be before any other routing metrics are utilised.

<a name="routeCount" />
### routeCount(options[, filter])

Creates middleware function that when invoked by express router will increment a metric with a specified name.

* `options.name` - Name of the metric for Librato.
* `options.period` - Period of sending this metric to Librato. Defaults to Librato default period of 60 seconds.
* `options.source` - Librato source name for this metric.
* `options.ignoreNonDirty` - If set will prevent sending to Librato if this metric did not increment. Defaults to `true`.
* `filter` - Can be either a `string` or a `function`. 
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

<a name="timing" />
### Timing(options)
Creates a new `Timing` object. `Options` are the same as in [`routeCount`](#routeCount)

#### measure(time[, filter])
Increment counter value.
* `time` - Time in the past to take the measurement from.
* `filter` - Optional string value to append to metric name key.