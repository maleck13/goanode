var winston = require('winston');
var dateFormat = require('dateformat');

module.exports = function(loggerConfig) {
  var transports = [];
  for (var i=0; i<loggerConfig.transports.length;i++) {
    var lg = loggerConfig.transports[i];
    var t;
    if (lg.type === 'winston.transports.Console') {
      t = new winston.transports.Console(lg);
    } else if (lg.type === 'winston.transports.File') {
      t = new winston.transports.File(lg);
    }
    t.timestamp = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    transports.push(t);
  }

  var logger = new(winston.Logger)({
    exitOnError: false,
    transports: transports
  });

  return logger;
};