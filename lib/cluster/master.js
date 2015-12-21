'use strict';

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

    var clusterConfig = context.sysconfig.teraslice.cluster;
    var host = makeHostName(clusterConfig.host, clusterConfig.port);
    var socket = require('socket.io-client')(host, {reconnect: true});

    socket.emit('node online', getNodeState(context));

    socket.on('create slicer', function(msg) {
        console.log('what does job look like in master',msg.job);
        context.foundation.startWorkers(1, 'slicer', msg.job);
        workerCount--;
    });

    socket.on('create workers', function(msg) {
        context.foundation.startWorkers(msg.workers, 'worker', msg.job)
    });

    socket.on('get node state', function() {
        socket.emit('node state', getNodeState(context));
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
            //TODO need to handle this
            console.log('getting a job finished call from slicer');
            //process.kill(process.pid, 'SIGINT')
        }
    }

    cluster.on('online', function(worker) {
        //temporary
        cluster.workers[worker.id].on('message', messageHandler);
    });

};