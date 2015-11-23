'use strict';

module.exports = function(context) {
    var cluster = context.cluster;
    var configWorkers = context.sysconfig.terafoundation.workers;
    var workerCount = configWorkers ? configWorkers : require('os').cpus().length;
    //temporary
    var processDone = 0;

    if (context.sysconfig.teraslice.distributed.isMaster) {

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
            //TODO review this, it does not play nice with lesser kill signals
            cluster.workers[msg.id].kill('SIGKILL');
            //temporary
            if (Object.keys(cluster.workers).length === processDone) {
                cluster.disconnect(function() {
                    process.exit();
                });
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