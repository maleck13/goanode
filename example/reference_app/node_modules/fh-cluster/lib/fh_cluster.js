/*
 Copyright Red Hat, Inc., and individual contributors

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
var backoff = require('backoff');
var cluster = require('cluster');
var os = require('os');
var _ = require('lodash');
var boundTasks = require('./bound_tasks');
var singleWorkerTasks = [];
var g_numWorkers;


/**
 * Function To Start The Cluster Workers And Initialise Any Single Tasks
 *
 * @param workerFunc
 * @param optionalNumWorkers
 * @param optionalBackoffStrategy
 * @param boundWorkerTasks: Array Of Worker Tasks To Be Bound To A Specific Process
 *   - workerFunction: Function To Start The Task
 *   - startEventId: Event That Will Start The Worker
 *   - preferredWorkerId: Preferred Worker ID To Bind The Task To
 */
module.exports = function fhCluster(workerFunc, optionalNumWorkers, optionalBackoffStrategy, boundWorkerTasks) {
  var defaultExponentialBackoffStrategy = new backoff.ExponentialStrategy({
    initialDelay: 500,
    maxDelay: 5000
  });

  if(_.isArray(optionalNumWorkers)){
    boundWorkerTasks = optionalNumWorkers;
    optionalNumWorkers = undefined;
  } else if(_.isArray(optionalBackoffStrategy)){
    boundWorkerTasks = optionalBackoffStrategy;
    optionalBackoffStrategy = undefined;
  }

  var backoffStrategy = _.find([optionalBackoffStrategy, defaultExponentialBackoffStrategy], isValidBackoffStrategy);
  var backoffResetTimeout = resetBackoffResetTimeout(backoffStrategy);

  var numWorkers = _.find([optionalNumWorkers, os.cpus().length], isValidNumWorkers);
  g_numWorkers = numWorkers;

  //Assigning Any Single Worker Tasks
  singleWorkerTasks = boundWorkerTasks || [];

  var invalidWorkerTask = _.find(singleWorkerTasks, validateSingleWorkerTask);

  if(invalidWorkerTask){
    throw invalidWorkerTask.error;
  }

  setOnWorkerListeningHandler();
  setupOnExitBackOff(backoffStrategy, backoffResetTimeout);

  start(workerFunc, numWorkers);
};


/**
 * Validating That The Single Worker Task has the required fields
 * @param task
 */
function validateSingleWorkerTask(task){

  var requiredFields = ['workerFunction', 'startEventId', 'preferredWorkerId'];

  var missingFields = _.filter(requiredFields, function(requiredField){
    return !_.has(task, requiredField);
  });

  if( _.first(missingFields)){
    task.error = "Missing Field " + _.first(missingFields);
    return task;
  }

  if(!_.isString(task.startEventId) || task.startEventId.length === 0 ){
    task.error = "Expected startEventId to be a String With Length > 0 ";
    return task;
  }

  if(!_.isFunction(task.workerFunction)){
    task.error = "Expected The workerFunction To Be A Function";
    return task;
  }

  if(!_.isNumber(task.preferredWorkerId) || task.preferredWorkerId === 0 || task.preferredWorkerId > g_numWorkers){
    task.error = "Expected preferredWorkerId to be a number > 0 and < numWorkers";
    return task;
  }

  return undefined;
}

function start(workerFunc, numWorkers) {
  //Need to store the number of workers
  g_numWorkers = numWorkers;
  if (cluster.isMaster) {
    _.times(numWorkers, function() {
      cluster.fork();
    });
  } else {
    cluster.worker.on('message', function(message){
      if(_.isString(message.startEventId)){
        //Need to do something
        var task = _.findWhere(singleWorkerTasks, {startEventId: message.startEventId});
        if(!task){
          return;
        }

        //Execute the required task.
        task.workerFunction(cluster.worker);
      }
    });

    workerFunc(cluster.worker);
  }
}

function setOnWorkerListeningHandler() {
  cluster.on('listening', function(worker, address) {
    var host = address.address || address.addressType === 4 ? '0.0.0.0' : '::';
    var addr = host + ':' + address.port;
    console.log('Cluster worker',  worker.id, 'is now listening at', addr);

    //A new process is listening, need to check if any bound tasks need to be assigned.
    boundTasks.setUpBoundTasks(singleWorkerTasks, cluster);
  });

  cluster.on('exit', function(){
    //If a worker exits, check that all bound workers are on a running worker.
    boundTasks.setUpBoundTasks(singleWorkerTasks, cluster);
  });
}

function setupOnExitBackOff(strategy, backoffResetTimeout) {
  cluster.on('exit', function(worker) {
    var nextRetry = strategy.next();
    console.log('Worker #', worker.id, 'exited. Will retry in',
      nextRetry, 'ms');

    setTimeout(function() {
      cluster.fork();
      resetBackoffResetTimeout(strategy, backoffResetTimeout);
    }, nextRetry);
  });
}

function resetBackoffResetTimeout(backoffStrategy, timeout) {
  if (timeout) {
    clearTimeout(timeout);
  }

  return setTimeout(function() {
    backoffStrategy.reset();
  }, 60*60*1000);
}

function isValidNumWorkers(number) {
  return number && typeof number === 'number' && number > 0;
}

function isValidBackoffStrategy(strategy) {
  return strategy
    && _.includes(_.functions(strategy), 'next')
    && _.includes(_.functions(strategy), 'reset');
}
