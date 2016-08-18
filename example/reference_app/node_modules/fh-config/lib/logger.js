var logger;
var util = require('util');

var defaultLoggerConf = {
  type:'bunyan',
  name: process.env.component || 'fh-config',
  streams:[{
    level:'trace',
    stream:process.stdout,
    src: true
  }]
};

function setLogger(logr) {
  logger = logr;
}

function initLogger(fhconfig, key) {
  var loggerConfKey = key || 'logger';
  if (fhconfig && fhconfig.value(loggerConfKey)) {

    var loggerConfig = fhconfig.value(loggerConfKey);
    //keep backward compatibility
    if (util.isArray(loggerConfig)) {
      loggerConfig.type = 'winston';
      loggerConfig.transports = loggerConfig;
    }

    if (loggerConfig.type !== undefined) {
      try {
        logger = require('./loggers/' + loggerConfig.type)(loggerConfig);
      } catch (e) {
        console.error('Error when init logger with config: ', util.inspect(e));
        logger = null;
      }
    }
  }

  if (!logger) {
    console.warn("No logger config found, creating a default bunyan console logger");
    logger = require('./loggers/' + defaultLoggerConf.type)(defaultLoggerConf);
  }
  return logger;
}

function getLogger(fhconfig, key) {
  if (!logger) {
    logger = initLogger(fhconfig, key);
  }
  return logger;
}

exports.setLogger = setLogger;
exports.getLogger = getLogger;
