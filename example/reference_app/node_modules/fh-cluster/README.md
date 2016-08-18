## fh-cluster

Wraps node cluster module to allow cleaner usage

### Install

```shell
npm install fh-cluster --save
```

### Usage

Import the module, pass your application entrypoint function to it:

```javascript
var express = require('express');
var fhcluster = require('fh-cluster');

function exampleApp(clusterWorker) {

  var app = express();
  app.get('/', function(req, res) {
    res.status(200).send('hello from worker #' + clusterWorker.id + '\n');
  });

  app.listen(8081);
}

//If numWorkers is set to undefined, then the number of CPUs will define the number of Workers.
var numWorkers = 4;
fhcluster(exampleApp, numWorkers);
```

#### Bound Tasks

It is possible to assign tasks to a specific worker. This is useful for the case where only one instance is required (e.g. a scheduler that is intended to work on a single worker only).

Bound Tasks will attempt to bind to the `preferred` worker. If the `preferred` worker exits, the task will be assigned to another worker.

The preference of assigning a task will take into account the number of tasks assigned to other workers. The worker with the lowest number of tasks will be assigned the task.


```javascript
var express = require('express');
var fhcluster = require('fh-cluster');

function exampleApp(clusterWorker) {

  var app = express();
  app.get('/', function(req, res) {
    res.status(200).send('hello from worker #' + clusterWorker.id + '\n');
  });

  app.listen(8081);
}

//If numWorkers is set to undefined, then the number of CPUs will define the number of Workers.
var numWorkers = 4;

//This task should be bound to worker 2.
var preferredWorkerId = 2;

//A unique ID identifying the task.
var startEventId = "startMySingleTask";

//This function will be executed to start the task on the preferred worker or another worker if the preferred worker is not available.
function workerFunction(worker){
    console.log("Single Bound Task Assigned To Worker " + worker.id);
};

var singleTask = {
    workerFunction: workerFunction,
    preferredWorkerId: preferredWorkerId,
    startEventId: startEventId
};


fhcluster(exampleApp, numWorkers, [singleTask]);
```
