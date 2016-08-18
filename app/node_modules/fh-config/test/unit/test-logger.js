var assert = require('assert');
var FHConfig = require('../../lib/fhconfig');
var winston = require('winston');
var bunyan = require('bunyan');

// var logger = require('../../lib/logger');

var winstonLoggerConf = [{
  type:'winston.transports.Console',
  level: 'silly'
}, {
  type: 'winston.transports.File',
  filename:'/tmp/fh_config_test_'+new Date().getTime()+ '_.log',
  level: 'debug'
}];

var bunyanLoggerConf = {
  'type':'bunyan',
  'name':'fhconfigtest',
  'streams':[{
    'type':'stream',
    'stream':'process.stdout',
    'src': true
  }]
};

exports.test_get_winston_logger = function(finish) {
  var fhconfig = new FHConfig({
    logger: winstonLoggerConf
  });
  fhconfig.setLogger(null);
  var winstonLogger = fhconfig.getLogger();
  assert.equal(typeof winstonLogger.log,'function');
  assert.ok(winstonLogger instanceof winston.Logger);
  finish();
};

exports.test_get_bunyan_logger = function(finish) {
  var fhconfig = new FHConfig({
    logger: bunyanLoggerConf
  });
  fhconfig.setLogger(null);
  var bunyanLogger = fhconfig.getLogger();
  assert.ok(bunyanLogger instanceof bunyan);

  finish();
};

exports.test_default_logger = function(finish) {
  var fhconfig = new FHConfig({
    logger: {
      type:'invalid'
    }
  });
  fhconfig.setLogger(null);
  var bunyanLogger = fhconfig.getLogger();
  assert.ok(bunyanLogger instanceof bunyan);

  finish();
};

exports.test_get_logger_with_keys = function(finish) {
  var fhconfig = new FHConfig({
    'test': {
      'log': winstonLoggerConf
    }
  });

  fhconfig.setLogger(null);
  var winstonLogger = fhconfig.getLogger('test.log');
  assert.ok(winstonLogger instanceof winston.Logger);
  assert.ok(winstonLogger.transports.file);

  finish();
};

