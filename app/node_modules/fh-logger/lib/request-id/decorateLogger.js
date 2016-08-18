/*
 JBoss, Home of Professional Open Source
 Copyright Red Hat, Inc., and individual contributors.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

var getLoggerNamespace = require('./loggerNamespace');

function getRequestId() {
  var ns = getLoggerNamespace();
  if (!ns) {
    // namespace not initialized, outside of request chain
    return;
  }
  return ns.get('requestId');
}

/**
 * Request Id setter, intended to be used by setup for unit testing
 * Normal usage should involve the express middleware in {@link ./middleware.js}
 * @param {String} id Request Id value
 * @param {Function} cb Callback to run with the requestId set
 */
function setRequestId(id, cb) {
  var ns = getLoggerNamespace();
  ns.run(function() {
    ns.set('requestId', id);
    cb();
  });
}

/**
 * Expose namespace binding for client use
 * @param  {Function} cb callback to wrap
 * @return {Function}      callback bound in namespace
 */
function ensureRequestId(cb) {
  var ns = getLoggerNamespace();
  if (!ns) {
    return cb;
  }
  return ns.bind(cb);
}

var loggingFunctions = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace'
];

/**
 * Overrides the logging functions to delegate to a 'simple' child that has the requestId bound at invocation time.
 * This seems the simplest way to have a dynamically bound field on a bunyan logger
 * According to the internal documentation, creation for 'simple' children is much more performant
 *
 * The promising alternative was using bunyan serializers, but they only run once on logger creation
 *
 * @param  {bunyan.Logger} logger Logger instance to decorate
 */
module.exports = function(logger) {
  // expose the request id for forwarding via HTTP requests
  logger.getRequestId = getRequestId;
  logger.setRequestId = setRequestId;
  logger.getLoggerNamespace = getLoggerNamespace;
  logger.ensureRequestId = ensureRequestId;
  loggingFunctions.forEach(function(f) {
    var originalFunction = logger[f];
    logger[f] = function() {
      var id = getRequestId();
      // call the original if outside of a request chain
      if (!id) {
        return originalFunction.apply(logger, arguments);
      }
      // use simpleChild flag for performance
      var child = logger.child({reqId: getRequestId()}, true);
      child[f].apply(child, arguments);
    };
  });
};