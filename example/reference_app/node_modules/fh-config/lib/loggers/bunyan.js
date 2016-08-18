var bunyan = require('bunyan');
var cluster = require('cluster');

module.exports = function(loggerConfig) {
  var ringBufferLimit = loggerConfig.ringBufferLimit || 200;
  var ringBuffer = new bunyan.RingBuffer({
    limit: ringBufferLimit
  });

  // log serializer for generic requests
  function reqSerializer(req) {
    if (req) {
      return {
        reqId: req.id,
        method: req.method,
        url: req.url,
        worker: cluster.worker? cluster.worker.id: -1
      };
    } else {
      return {};
    }
  }

  // Iterate through our streams and set accordingly
  for (var i = 0; i < loggerConfig.streams.length; i++) {
    var stream = loggerConfig.streams[i];
    if (stream.type === 'raw') {
      stream.stream = ringBuffer;
    }
    if (stream.type === 'stream') {
      stream.stream = eval(stream.stream); // jshint ignore:line
    }
  }

  loggerConfig.serializers = {
    req: reqSerializer,
    res: bunyan.stdSerializers.res
  };

  var logger = bunyan.createLogger(loggerConfig);
  return logger;
};