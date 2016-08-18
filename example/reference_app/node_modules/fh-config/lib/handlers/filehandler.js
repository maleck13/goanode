var fs = require('fs');

module.exports = {
  load: function(configSource, cb) {
    if (!fs.existsSync(configSource)) {
      return cb(new Error('config file does not exist : ' + configSource));
    }
    fs.readFile(configSource, 'utf8', function(err, data) {
      if (err) {
        return cb(err);
      }
      return cb(null, data);
    });
  }
};