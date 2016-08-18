
var _ = require('lodash');

function workerIsAlive(worker){
  return worker.state !== 'dead';
}

/**
 * Setting up any bound tasks assigned to a worker.
 *
 * This function will check that any bound tasks are assigned to a running worker. If there is no worker assigned
 */
function setUpBoundTasks(singleWorkerTasks, cluster){

  //console.log("setUpBoundTasks", singleWorkerTasks, cluster);

  _.each(singleWorkerTasks, function(task){
    //Does the worker id exist

    //Worker is alive and assigned to the task and still running.
    if(task.worker && workerIsAlive(task.worker)){
      return;
    }

    //If the master does not have any workers, then don't assign them to tasks.
    if(!cluster.workers){
      return;
    }

    //If no worker, assign the preferred worker if available
    if(!task.worker && cluster.workers[task.preferredWorkerId]){
      task.worker = cluster.workers[task.preferredWorkerId];
    } else if(task.worker && !workerIsAlive(task.worker)){
      //Worker is dead, need to assign it to another worker.

      //Find A Worker With No Task Assigned
      var workerTasks = _.map(cluster.workers, function(worker){
        //Check for the worker assigned to tasks
        var tasks = _.filter(singleWorkerTasks, function(singleWorkerTask){
          return singleWorkerTask.worker === worker;
        });

        return {
          worker: worker,
          tasks: tasks.length
        };
      });

      workerTasks = _.filter(workerTasks, function(workerTask){
        return workerIsAlive(workerTask.worker);
      });

      //Find the job with the lowest number of tasks assigned
      workerTasks = _.sortBy(workerTasks, function(workerTask){
        return workerTask.tasks;
      });

      var lowestWorkerTask = _.first(workerTasks);

      task.worker = lowestWorkerTask ? lowestWorkerTask.worker : task.worker;
    }

    if(task.worker && workerIsAlive(task.worker)){
      task.worker.send({
        startEventId: task.startEventId
      });
    }

  });
}

module.exports = {
  setUpBoundTasks: setUpBoundTasks
};