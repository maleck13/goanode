var FHConfig = require('../../lib/fhconfig');
var sinon = require('sinon');
var assert = require('assert');

exports.test_validate_with_function = function(finish) {
  var fhconfig = new FHConfig({
    'test': 'test'
  });
  var cb = sinon.spy();
  fhconfig.validate(cb);
  assert.ok(cb.calledOnce);
  finish();
};

exports.test_validate_with_keys = function(finish) {
  var invalid = new FHConfig({
    'fhditch': {
      'host': 'localhost',
      'port': 9999
    },
    'settings': {
      'test': 'test1'
    }
  });
  var spy = sinon.spy(invalid, 'validate');
  try {
    invalid.validate('none');
  } catch (e) {
    // Empty
  }
  assert.ok(spy.threw());

  spy.reset();
  try {
    invalid.validate(['settings.test1']);
  } catch (e) {
    // Empty
  }
  assert.ok(spy.threw());

  spy.reset();
  var valid = new FHConfig({
    'fhditch': {
      'host': 'localhost',
      'port': 9999,
      'protocol': 'http'
    },
    'setting': {
      'test': 'test'
    }
  });
  spy = sinon.spy(valid, 'validate');

  valid.validate(['fhditch', 'setting.test']);

  assert.ok(!spy.threw());
  finish();
};

exports.test_value = function(finish) {
  var fhconfig = new FHConfig({
    'settings':{
      'a': 'this is string',
      'b': ['array'],
      'c': 'true',
      'd': '8888',
      'e': true,
      'f': 9
    }
  });
  assert.equal('this is string', fhconfig.value('settings.a'));
  assert.equal('array', fhconfig.value('settings.b')[0]);
  assert.equal(true, fhconfig.bool('settings.c'));
  assert.equal(8888, fhconfig.int('settings.d'));
  assert.equal(true, fhconfig.bool('settings.e'));
  assert.equal(9, fhconfig.int('settings.f'));
  assert.equal(null, fhconfig.value('settings.g'));
  finish();
};

exports.test_mongo_connection_string = function(finish) {
  var fhconfig = new FHConfig({
    'database': {
      'mongo': {
        'enabled': true,
        'name': 'test',
        'host': 'localhost',
        'port': 27017,
        'auth': {
          'enabled': true,
          'user': 'test',
          'pass': 'test'
        }
      }
    }
  });
  var mongoStr = fhconfig.mongoConnectionString('database.mongo');
  assert.equal('mongodb://test:test@localhost:27017/test', mongoStr);
  fhconfig = new FHConfig({
    'mongo': {
      'enabled': true,
      'name': 'test',
      'host': 'localhost, example.com',
      'port': '27017,27018',
      'auth': {
        'enabled': true,
        'user': 'test',
        'pass': 'test'
      }
    }
  });
  mongoStr = fhconfig.mongoConnectionString();
  assert.equal('mongodb://test:test@localhost:27017,example.com:27018/test', mongoStr);

  fhconfig = new FHConfig({
    'mongo': {
      'enabled': true,
      'name': 'test',
      'host': ['localhost', 'example.com'],
      'port': '27017,27018',
      'auth': {
        'enabled': true,
        'user': 'test',
        'pass': 'test'
      },
      'replSetName': 'test'
    }
  });
  mongoStr = fhconfig.mongoConnectionString();
  assert.equal('mongodb://test:test@localhost:27017,example.com:27018/test?replicaSet=test', mongoStr);
  finish();
};

exports.test_mongoose_url = function(finish) {
  var fhconfig = new FHConfig({
    'database': {
      'mongo': {
        'enabled': true,
        'name': 'test',
        'host': 'localhost',
        'port': 27017,
        'auth': {
          'enabled': true,
          'user': 'test',
          'pass': 'test'
        }
      }
    }
  });
  var mongoStr = fhconfig.mongooseConnectionString('database.mongo');
  assert.equal('mongodb://test:test@localhost:27017/test', mongoStr);
  fhconfig = new FHConfig({
    'mongo': {
      'enabled': true,
      'name': 'test',
      'host': 'localhost, example.com',
      'port': '27017,27018',
      'auth': {
        'enabled': true,
        'user': 'test',
        'pass': 'test'
      }
    }
  });
  mongoStr = fhconfig.mongooseConnectionString();
  assert.equal('mongodb://test:test@localhost:27017/test,mongodb://example.com:27018', mongoStr);
  finish();
};

exports.test_reload = function(finish) {
  var fhconfig = new FHConfig({
    'settings':{
      'test':'test'
    }
  });
  var cb = sinon.spy();
  fhconfig.on('reloaded', cb);
  assert.equal(fhconfig.value('settings.test'), 'test');
  fhconfig.reload({
    'settings':{
      'test': 'test1'
    }
  });
  assert.equal(fhconfig.value('settings.test'), 'test1');
  assert.ok(cb.calledOnce);
  finish();
};

exports.test_print = function(finish) {
  var fhconfig = new FHConfig({
    'settings':{
      'test':'test'
    }
  });
  fhconfig.print();
  finish();
};