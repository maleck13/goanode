var assert = require('assert');
var templatewrapper = require('../../lib/handlers/templatewrapper');
var fileHandler = require('../../lib/handlers/filehandler');
var path = require('path');

// Setup environment variables
require('../fixture/env');

var confFilePath = path.resolve(__dirname, '../fixture/conf.json');


exports.test_execute_template = function(cb) {
  fileHandler.load(confFilePath,function(err,data) {
    assert.equal(err, null);
    templatewrapper.applyTemplate(data, function(err, config) {
      assert.equal(err, null);
      assert.equal(config.settings.test_empty, '');
      assert.equal(config.settings.test_default, 'testDef');
      assert.equal(config.settings.test, 'test');
      assert.equal(config.settings.test_execute, 'executed-value');
      assert.equal(config.settings.test_multiple, 'http://localhost:7000');
      assert.ok(config.settings.original_cmd);
      assert.equal(config.settings.failcmd, '');
      cb();
    });
  });
};