'use strict';

module.exports = function(context) {
    var cluster = context.cluster;
    var configWorkers = context.sysconfig.terafoundation.workers;
    var workerCount = configWorkers ? configWorkers : require('os').cpus().length;
    //temporary
    var processDone = 0;

    if (workerCount === 0) {
        throw new Error(' Number of workers specified in terafoundtion configuration need to be set to greater than zero')
    }

    if (context.sysconfig.teraslice.slicer.primary) {

        //TODO add checks in place
        context.foundation.startWorkers(1, 'slicer');
        workerCount--;
    }

    while (workerCount) {
        workerCount--;
        context.foundation.startWorkers(1, 'worker');
    }

    function messageHandler(msg) {
        if (msg.message === 'terminate_child_process') {
            processDone++;

            //temporary
            if (Object.keys(cluster.workers).length === processDone) {
                process.kill(process.pid, 'SIGTERM')
            }
        }
        else if (msg.message === 'terminate') {

        }
    }

    cluster.on('online', function(worker) {
        //temporary
        cluster.workers[worker.id].on('message', messageHandler);
    });

};