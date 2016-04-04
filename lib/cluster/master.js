'use strict';

//TODO look into dynamic validations with convict based on lifecycles
//TODO for master shutdown, need to empty newWorkerQueue so no restarts happen
var Queue = require('../utils/queue');
var newWorkerQueue = new Queue;
var makeHostName = require('../utils/cluster').makeHostName;

function getNodeState(context) {
    var state = {
        node_id: context.sysconfig._nodeName,
        total: context.sysconfig.terafoundation.workers,
        hostname: context.sysconfig.teraslice.hostname
    };
    var clusterWorkers = context.cluster.workers;
    var active = [];

    for (var childID in clusterWorkers) {
        var child = {
            worker_id: clusterWorkers[childID].id,
            assignment: clusterWorkers[childID].assignment,
            pid: clusterWorkers[childID].process.pid
        };

        if (clusterWorkers[childID].job_id) {
            child.job_id = clusterWorkers[childID].job_id
        }

        active.push(child);
    }

    state.active = active;
    state.available = state.total - active.length;

    return state;
}

function killWorkersByJob(context, id) {
    var workers = context.cluster.workers;
    for (var key in workers) {
        if (workers[key].job_id === id) {
            workers[key].send({message: 'shutdown'})
        }
    }
}

module.exports = function(context) {
    var cluster = context.cluster;
    var logger = context.logger;
    var configWorkers = context.sysconfig.terafoundation.workers;
    var workerCount = configWorkers ? configWorkers : require('os').cpus().length;
    var sendProcessMessage = require('../utils/config').sendProcessMessage;
    //temporary
    var processDone = 0;

    if (workerCount === 0) {
        throw new Error(' Number of workers specified in terafoundtion configuration need to be set to greater than zero')
    }

    if (context.sysconfig.teraslice.cluster.master) {
        context.foundation.startWorkers(1, {assignment:'cluster_master'});
    }

    var config = context.sysconfig.teraslice;
    var host = makeHostName(config.cluster.master_hostname, config.cluster.port);
    console.log('what is host', host);
    logger.info("node " + context.sysconfig._nodeName+ " is attempting to connect to: "+ host);


    var socket = require('socket.io-client')(host, {reconnect: true});
    var jobList = {};

    socket.on('connect', function(){
        //a reconnect is fired the first time its connecting => socket.io-client/lib/manager line 184-197
        logger.info('node has successfully connected to: '+ host );
        socket.emit('node online', getNodeState(context))
    });

    socket.on('disconnect', function(){
        logger.info('node has disconnected from: '+ host )
    });

    socket.on('create slicer', function(msg) {
        context.foundation.startWorkers(1, {assignment: 'slicer', job: msg.job});
        socket.emit('node state', getNodeState(context));

        workerCount--;
    });

    socket.on('create workers', function(msg) {
        context.foundation.startWorkers(msg.workers, 'worker', {job: msg.job});
        socket.emit('node state', getNodeState(context));
    });

    socket.on('get node state', function() {
        socket.emit('node state', getNodeState(context));
    });

    socket.on('terminate job', function(id) {
        killWorkersByJob(context, id);
        socket.emit('node state', getNodeState(context));
    });

    socket.on('stop job', function(data){
        killWorkersByJob(context, data.job_id);
        socket.emit('node state', getNodeState(context));
    });

    socket.on('pause slicer', function(data) {
        data.workers.forEach(function(worker) {
            sendProcessMessage(cluster, worker.worker_id, {message: 'pause'})
        })
    });

    socket.on('resume slicer', function(data) {
        data.workers.forEach(function(worker) {
            sendProcessMessage(cluster, worker.worker_id, {message: 'resume'})
        })
    });

    socket.on('restart slicer', function(data) {
        data.workers.forEach(function(worker) {
            newWorkerQueue.enqueue({job: cluster.workers[worker.worker_id].job, jobRetry: true});
            sendProcessMessage(cluster, worker.worker_id, {message: 'exit for retry'})
        });
    });


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
            //sending job finished notification to cluster_master
            socket.emit('job finished', msg.job_id);
        }
    }

    cluster.on('online', function(worker) {
        //temporary
        cluster.workers[worker.id].on('message', messageHandler);
    });

    cluster.on('exit', function(worker) {
        socket.emit('node state', getNodeState(context));

        //used to catch slicer shutdown to allow clean startup of the new one
        if (worker.assignment === 'slicer' && newWorkerQueue.size()) {
            context.foundation.startWorkers(1, 'slicer', newWorkerQueue.dequeue());

        }
    })

};