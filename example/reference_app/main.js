/**
 * Created by kelly on 16/08/2016.
 */

var express = require('express');
var fhconfig = require('fh-config');
var cors = require('cors');
var bodyParser = require('body-parser');
var fhcluster = require('fh-cluster');
var fhlogger = require('fh-logger');
var async = require('async');
var validation = require('./config/configValidation.js')
var args = require('optimist').argv;
var util = require('util');
var path =require('path');
var fs = require('fs');
var route = require('./router');
var errorHandler = require('./error');
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

if (args.h || args._.length < 1) {
  usage();
}

function setupConfig(cb){
	fhconfig.init(process.env.conf_file, validation, function(err) {
    if (err) {
      /* eslint-disable no-console */
      console.error("Problems reading config file: " + process.env.conf_file);
      console.error(err);
      /* eslint-enable no-console */
      process.exit(1);
    }
    cb();
  });
}

function setupLogger(cb){
	logger = fhlogger.createLogger(fhconfig.getConfig().rawConfig.logger);
	cb();
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
    });
  });
}

function startWorker(){
  setupUncaughtExceptionHandler(logger);
  setupFhconfigReloadHandler(fhconfig);
  startApp();
}

function startApp(){
  var app = express();
  app.use(logger.requestIdMiddleware);
  	 // Enable CORS for all requests
  app.use(cors());

  // Request logging
  app.use(require('express-bunyan-logger')({ logger: logger, parseUA: false }));

  // Parse JSON payloads
  app.use(bodyParser.json({limit: fhconfig.value('fhmbaas.maxpayloadsize') || "20mb"}));

  //setup the routes
  route(app);

  //error handler
  app.use(errorHandler);

  var port = fhconfig.int('port');
  app.listen(port, () => {
    // Get our version number from package.json
    var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, './package.json'), "utf8"));
    /* eslint-disable no-console */
    console.log("Started " + TITLE + " version: " + pkg.version + " at: " + new Date() + " on port: " + port);
    /* eslint-enable no-console */
  });
}


function main(){
	async.series([
			async.apply(setupConfig),
			async.apply(setupLogger),
		],(err)=>{
      if (err){
        console.error("error on startup ", err);
        process.exit(1);
      }
      if (args.d === true || args["master-only"] === true) {
        /* eslint-disable no-console */
        console.log("starting single master process");
        /* eslint-enable no-console */
        startWorker();
      }else{
        var numWorkers = args["workers"];
        fhcluster(startWorker,numWorkers);
      }
    });
}

main();
