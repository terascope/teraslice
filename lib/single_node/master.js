'use strict';

var validateNumOfWorkers = require('../utils/config').validateNumOfWorkers;

module.exports = function(context) {
    var cluster = context.cluster;
    var workerCount = validateNumOfWorkers(context);
    //temporary
    var processDone = 0;

    //TODO add checks in place
    context.foundation.startWorkers(1, 'slicer');
    workerCount--;

    context.foundation.startWorkers(workerCount, 'worker');

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

