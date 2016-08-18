var cls = require('continuation-local-storage');
var namespace = require('../const').namespace;
var ns;


module.exports = function getLoggerNamespace() {
  if (!ns) {
    ns = cls.createNamespace(namespace);
  }

  return ns;
};