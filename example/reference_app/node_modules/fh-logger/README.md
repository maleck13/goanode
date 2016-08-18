## fh-logger
Enables a simple way of configuring and creating [Bunyan](https://github.com/trentm/node-bunyan) loggers, configured with request serializers, including clustering information. 

### Install
```shell
npm install fh-logger
```

### Usage


#### JavaScript object configuration  

```javascript
var fh_logger = require('fh-logger');
var logger = fh_logger.createLogger({name: 'first'});
```
This will produce a Bunyan logger that will have a request serializer, and will log to ```process.stdout```.


#### String configuration
You can pass in a JSON string containing your logger configuration. This is useful if you define your logger configuration externally to your code, for example in a .json file:  

```json
{
  "name": "testing",
  "streams": [{
    "type": "file",
    "stream": "file",
    "path": "/path/to/testing.log",
    "level": "info"
  }, {
    "type": "stream",
    "src": true,
    "level": "trace",
    "stream": "process.stdout"
  }, {
    "type": "raw",
    "src": true,
    "level": "trace"
  }]
}
```
Create the logger passing in the string configuration read from the above file:

```javascript
var fh_logger = require("fh-logger");
var logger = fh_logger.createLogger(stringConfig);
```

### Testing
To run all the tests:

```shell
grunt mochaTest
```

#### Request Id logging
`fh-loggger` also exports express-compatible middleware to generate unique requestId and automatically include it in logging methods.

```
var fh_logger = require('fh-logger');

// must be called to setup the middleware
var logger = fh_logger.createLogger({
  name: 'first',
  requestIdHeader: 'X-SOME-HTTP-HEADER'
});
app.use(logger.requestIdMiddleware);
app.get('/', function(req, res) {
  console.log(req.requestId); // uuid
  console.log(logger.requestId); // uuid
  logger.info('some message'); // -> {msg: 'some message', requestId: 'some-uuid'}
  logger.info(logger.requestIdHeader) // -> {msg: 'X-SOME-HTTP-HEADER', requestId: 'some-uuid'}
})
```

By default it utilizes the 'X-FH-REQUEST-ID' header, this can be overridden by the configuration passed to `createLogger` as shown above

##### ensureRequestId

For logging inside callbacks that are supposed to display the `requestId` but for some reason do not, utilize the exported `ensureRequestId({Function})`:

```
logger.ensureRequestId(function asyncOperation(err, data){
  logger.error(err); // -> {req.reqId: 'some-uuid'}
});
```

For more information refer to the [continuation-local-storage module docs](https://github.com/othiym23/node-continuation-local-storage#namespacebindcallback-context)
