'use strict';

//TODO look into dynamic validations with convict based on lifecycles
//TODO this is duplicate

function makeHostName(hostname, port) {

    if (!hostname.match(/http/)) {
        hostname = 'http://' + hostname;
    }

    var lastChar = hostname[hostname.length - 1];

    if (lastChar !== ':') {
        return hostname + ':' + port;
    }
    else {
        return hostname + port;
    }

}

function getNodeState(context) {
    var state = {id: context.sysconfig._nodeName, total: context.sysconfig.terafoundation.workers};
    var clusterWorkers = context.cluster.workers;
    var active = [];

    for (var childID in clusterWorkers) {
        active.push({id: clusterWorkers[childID].id, assignment: clusterWorkers[childID].assignment});
    }

    state.active = active;
    state.available = state.total - active.length;

    return state;
}

function getClusterConfig(context) {
    var config = context.sysconfig.teraslice.cluster;

    //simple validations might get rid of in dynamic validation listed at top
    if (!config.host) {
        throw new Error(' host is not defined by the system config in teraslice.cluster')
    }

    if (!config.port) {
        throw new Error(' port is not defined by the system config in teraslice.cluster')
    }

    return config;
}


function killWorkersByJob(context, id) {
    var workers = context.cluster.workers;
    for (var key in workers) {
        if (workers[key].jobID === id) {
            console.log('sending shutdown msg to', key);
            workers[key].send({message: 'shutdown'})
        }
    }
}

module.exports = function(context) {
    var cluster = context.cluster;
    var configWorkers = context.sysconfig.terafoundation.workers;
    var workerCount = configWorkers ? configWorkers : require('os').cpus().length;
    //temporary
    var processDone = 0;

    if (workerCount === 0) {
        throw new Error(' Number of workers specified in terafoundtion configuration need to be set to greater than zero')
    }

    if (context.sysconfig.teraslice.cluster.master) {
        console.log('am i getting in here');
        context.foundation.startWorkers(1, 'cluster_master');

    }

    var clusterConfig = getClusterConfig(context);
    var host = makeHostName(clusterConfig.host, clusterConfig.port);
    var socket = require('socket.io-client')(host, {reconnect: true});

    socket.emit('node online', getNodeState(context));

    socket.on('create slicer', function(msg) {
        // console.log('what does job look like in master',msg.job);
        context.foundation.startWorkers(1, 'slicer', msg.job);
        console.log('workers?', context.cluster.workers)
        console.log('workers job', msg.job)
        socket.emit('node state', getNodeState(context));

        workerCount--;
    });

    socket.on('create workers', function(msg) {
        context.foundation.startWorkers(msg.workers, 'worker', msg.job);
        socket.emit('node state', getNodeState(context));
    });

    socket.on('get node state', function() {
        socket.emit('node state', getNodeState(context));
    });

    socket.on('terminate job', function(id) {
        console.log('i should determine the workers to terminate and kill them!');
        killWorkersByJob(context, id)
    });


    function messageHandler(msg) {
        console.log('master is getting a process message', msg);
        if (msg.message === 'shutdown') {
            console.log('getting a shutdown', msg)
            processDone++;
            cluster.workers[msg.id].kill('SIGINT');
            //temporary

            console.log('the cluster', cluster.workers)
            if (Object.keys(cluster.workers).length === processDone) {
                process.exit()
            }
        }
        else if (msg.message === 'job finished') {
            //TODO need to handle this
            console.log('getting a job finished call from slicer');

            //sending job finished notification to cluster_master
            socket.emit('job finished', msg.jobID);
        }

        else if(msg.message === 'hello'){
            console.log('hello from the outside')
        }
    }

    cluster.on('online', function(worker) {
        //temporary
        cluster.workers[worker.id].on('message', messageHandler);
    });

};