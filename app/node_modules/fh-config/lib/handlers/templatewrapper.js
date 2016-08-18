var _ = require('underscore');
var execSync = require('child_process').execSync;

var obj = module.exports = {};

_.templateSettings = {
  //  <% if(anyvalue){ print anyvalue } %> - execute javascript code
  evaluate: /<%(.+?)%>/g,
  //  {{ anyValue }} - print value
  interpolate: /\{\{(.+?)}}/g
};

/**
 * Apply environment variables to template
 *
 * @param dataString template
 */
obj.applyTemplate = function(dataString, cb) {
  var templateInput = {
    env: process.env,
    exec: executeWithSeparator,
    fallback: applyDefault
  };
  try {
    var template = _.template(dataString);
    var outputString = template(templateInput);
    return cb(null, JSON.parse(outputString));
  } catch (e) {
    return cb(e);
  }
};

/// HELPERS

/**
 * Execute command and return results as string.
 *
 *  @param command command to execute
 *  @param separator for each output line - defaults to comma
 *  @param defaultValue when command executed with error (empty string by default)
 *
 *  @return command result or defaultValue if command failed to execute
 */
function executeWithSeparator(command, separator, defaultValue) {
  if (!separator) {
    separator = ',';
  }
  try {
    var stdout = execSync(command, {encoding: 'utf8', timeout: 5000});
    var outputArray = stdout.split("\n");
    var nonEmptyLines = [];
    _.each(outputArray, function(line) {
      if (line) {
        nonEmptyLines.push(line.trim());
      }
    });
    return nonEmptyLines.join(separator);
  } catch (e) {
    return defaultValue ? defaultValue : "";
  }
}


/**
 * Allows to apply default value if original value is missing
 *
 * @param value
 * @param defaultValue
 * @returns {string}
 */
function applyDefault(value, defaultValue) {
  return value ? value : defaultValue;
}


