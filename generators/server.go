package generators

import (
	"flag"
	"fmt"
	"os"
	"text/template"

	"github.com/goadesign/goa/design"
	"github.com/goadesign/goa/goagen/codegen"
)

type ServerGenerator struct {
	OutDir string
	Api    *design.APIDefinition
}

func ServerGenerate() ([]string, error) {
	var (
		outDir string
		ver    string
	)
	set := flag.NewFlagSet("app", flag.PanicOnError)
	set.String("design", "", "")
	set.StringVar(&outDir, "out", "", "")
	set.StringVar(&ver, "version", "", "")
	set.Parse(os.Args[1:])
	if err := codegen.CheckVersion(ver); err != nil {
		return nil, err
	}

	g := &ServerGenerator{OutDir: outDir, Api: design.Design}

	return g.Generate()
}

func (se *ServerGenerator) Generate() ([]string, error) {
	fileName := se.OutDir + "/main.js"
	var files []string
	files = append(files, fileName)
	if err := CreateFileIfNotExists(fileName); err != nil {
		return nil, err
	}
	f, err := os.OpenFile(fileName, os.O_WRONLY|os.O_TRUNC, 0666)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer f.Close()
	t := template.New("main").Funcs(CommonTemplateFuncs)
	t, err = t.Parse(mainTemplate)
	if err != nil {
		fmt.Println("error parsing", err)
		return nil, err
	}
	if err := t.Execute(f, se.Api); err != nil {
		return nil, err
	}

	return files, nil
}

var mainTemplate = `/**
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
var logger;

var TITLE = "{{.Name}}";
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

function errorHandler(err,req,res,  next){
  var responseData;
    if (err.name === 'JsonSchemaValidation') {

        // Log the error however you please
        console.log(err.message);
        // logs "express-jsonschema: Invalid data found"

        // Set a bad request http response status
        res.status(400);

        // Format the response body
        responseData = {
           statusText: 'Bad Request',
           jsonSchemaValidation: true,
           validations: err.validations  // All of your validation information
        };

       res.json(responseData);

    } else {
        // pass error to next error middleware handler
        next(err);
    }
};

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
        console.log("starting workers ", numWorkers);
        fhcluster(startWorker,numWorkers);
      }
    });
}

main();
`
