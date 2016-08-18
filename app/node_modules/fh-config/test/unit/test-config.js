var assert = require('assert');
var path = require('path');
var util = require('util');

var confFilePath = path.resolve(__dirname, '../fixture/conf.json');
var config = require('../../lib/config');
var required = [
  "settings.test",
  "settings.test_empty",
  "settings.test_default",
  "settings.test_multiple",
  "settings.test_execute",
  "settings.failcmd"
];

require('../fixture/env');

exports.beforeEach = function(cb) {
  config.reset();
  cb();
};


exports.test_init_config = function(cb) {
  config.init(confFilePath, function(err, fhconfig) {
    assert.ok(!err);
    assert.ok(fhconfig);

    ['value', 'validate', 'int', 'bool', 'mongoConnectionString', 'mongooseConnectionString', 'emit', 'getLogger', 'setLogger', 'on', 'once', 'addListener', 'removeListener'].forEach(function(funcName) {
      assert.ok(typeof config[funcName] === 'function', 'required function = ' + funcName);
      assert.ok('test' === config.value('settings.test'));
    });
    cb();
  });
};


exports.test_init_with_error = function(cb) {
  config.init(confFilePath, ['settings.test3'], function(err, fhconfig) {
    assert.ok(err);
    assert.ok(!fhconfig);
    cb();
  });
};

exports.test_get_config = function(cb) {
  config.init(confFilePath, function(err) {
    assert.ok(!err, util.inspect(err));

    var fhconf = config.getConfig();
    assert.ok(!err);
    assert.equal(fhconf.value('settings.test'), 'test');
    cb();
  });
};

exports.test_reload = function(cb) {
  config.init(confFilePath, function(err) {
    assert.ok(!err);
    config.reload([], function(err) {
      assert.ok(!err);
      cb();
    });
  });
};

exports.test_updated_config = function(cb) {
  config.init(confFilePath, required, function(err, config) {
    assert.ok(!err);
    assert.ok(config);
    cb();
  });
};
