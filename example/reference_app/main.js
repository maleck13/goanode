/**
 * Created by kelly on 16/08/2016.
 */

var express = require('express');
var fhconfig = require('fh-config');
var cors = require('cors');
var bodyParser = require('body-parser');
var fhcluster = require('fh-cluster');
var lodash = require('loadash');
var validation = require('./config/configValidation.js')
var logger;

var TITLE = "cellar";
process.env.component = TITLE;
if (!process.env.conf_file) {
  process.env.conf_file = process.argv[2];
}


// args and usage
function usage() {
  /* eslint-disable no-console */
  console.log("Usage: " + args.$0 + " <config file> [-d] (debug) --master-only --workers=[int] \n --master-only will override  --workers so should not be used together");
  /* eslint-enable no-console */
  process.exit(0);
}

if (args.h) {
  usage();
}

if (args._.length < 1) {
  usage();
}

function setupConfig(cb){
	fhconfig.init(configFile, validation, function(err) {
    if (err) {
      /* eslint-disable no-console */
      console.error("Problems reading config file: " + configFile);
      console.error(err);
      /* eslint-enable no-console */
      process.exit(-1);
    }
    cb();
  });
}

function setupLogger(cb){
	logger = fhlogger.createLogger(fhconfig.getConfig().rawConfig.logger);
	cb();
}

function startWorker(){

}

function setupUncaughtExceptionHandler(logger) {
  // handle uncaught exceptions
  process.on('uncaughtException', function(err) {
    logger.error("FATAL: UncaughtException, please report: " + util.inspect(err));
    /* eslint-disable no-console */
    console.error(new Date().toString() + " FATAL: UncaughtException, please report: " + util.inspect(err));
    /* eslint-enable no-console */
    if (err !== undefined && err.stack !== undefined) {
      logger.error(util.inspect(err.stack));
    }
    /* eslint-disable no-console */
    console.trace(err.stack);
    /* eslint-enable no-console */
    process.exit(1);
  });

  // If the Node process ends, close the Mongoose connection
  process.on('SIGINT', closeMongooseConnection).on('SIGTERM', closeMongooseConnection);
}

function setupFhconfigReloadHandler(fhconfig) {
  process.on(fhconfig.RELOAD_CONFIG_SIGNAL, function() {
    fhconfig.reload(cluster.workers, function(err) {
      if (err) {
        /* eslint-disable no-console */
        console.error("Config not reloaded");
        console.error(err);
        console.error("Please fix and try again!!");
        /* eslint-enable no-console */
      }
      createAndSetLogger();
    });
  });
}

function startApp(){
  var app = express();
  app.use(logger.requestIdMiddleware);
  	 // Enable CORS for all requests
  app.use(cors());

  // Request logging
  app.use(require('express-bunyan-logger')({ logger: logger, parseUA: false }));
}


function main(){
	async.series([
			async.apply(setupConfig),
			async.apply(setupLogger),
		]);
}
