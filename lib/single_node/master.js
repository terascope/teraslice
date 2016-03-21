'use strict';

var validateNumOfWorkers = require('../utils/config').validateNumOfWorkers;
var getJobWithID = require('../utils/config').getJobWithID;

module.exports = function(context) {
    var cluster = context.cluster;
    var workerCount = validateNumOfWorkers(context);
    var logger = context.logger;
    var job = getJobWithID(context);

    //temporary
    var processDone = 0;
    //TODO add checks in place

    context.foundation.startWorkers(1, 'slicer', {job: job});
    workerCount--;

    context.foundation.startWorkers(workerCount, 'worker', {job: job});

    function messageHandler(msg) {

        if (msg.message === 'shutdown') {
            processDone++;
            cluster.workers[msg.id].kill('SIGINT');
            //temporary
            if (Object.keys(cluster.workers).length === processDone) {
                process.exit()
            }
        }
        else if (msg.message === 'job finished') {
            process.kill(process.pid, 'SIGINT')
        }
    }

    cluster.on('online', function(worker) {
        //temporary
        cluster.workers[worker.id].on('message', messageHandler);
    });

};

