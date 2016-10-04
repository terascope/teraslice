'use strict';
var makeHostName = require('../../utils/cluster').makeHostName;

//TODO add appropriate guards to what api are available for each type

var networkMapping = {
    'node:cluster:connect': 'connect',
    'node:cluster:disconnect': 'disconnect',
    'node:online': 'node:online',
    'node:disconnect': 'disconnect',
    'node:state': 'node:state',
    'node:message:processed': 'node:message:processed',
    'node:workers:over_allocated': 'node:workers:over_allocated',
    'node:connection:error': 'error',
    'cluster:slicer:analytics': 'cluster:slicer:analytics',
    'cluster:slicer:create': 'cluster:slicer:create',
    'cluster:workers:create': 'cluster:workers:create',
    'cluster:workers:remove': 'cluster:workers:remove',
    'cluster:node:state': 'cluster:node:state',
    'cluster:job:stop': 'cluster:job:stop',
    'cluster:job:pause': 'cluster:job:pause',
    'cluster:job:resume': 'cluster:job:resume',
    'cluster:job:restart': 'cluster:job:restart',
    'cluster:node:get_port': 'cluster:node:get_port',
    'cluster:connection:error': 'error',
    'slicer:recovery:failed': 'slicer:recovery:failed',
    'slicer:job:finished': 'slicer:job:finished',
    'slicer:processing:error': 'slicer:processing:error',
    'slicer:initialized': 'slicer:initialized',
    'slicer:job:update': 'slicer:job:update',
    'slicer:slice:new': 'slicer:slice:new',
    'slicer:slice:recorded': 'slicer:slice:recorded',
    'worker:ready': 'worker:ready',
    'worker:slice:complete': 'worker:slice:complete',
    'worker:disconnect': 'disconnect',
    'worker:connection:error': 'error',
    'worker:slicer:connect': 'connect',
    'job:error:terminal': 'job:error:terminal'
};

//shutdown is a process message from terafoundation
var processMapping = {
    'process:SIGTERM': 'SIGTERM',
    'process:SIGINT': 'SIGINT',
    'child:exit': 'exit',
    'worker:shutdown': 'worker:shutdown',
    'cluster:error:terminal': 'cluster:error:terminal',
    'shutdown': 'worker:shutdown'
};

function makeConfigurations(context) {
    var host, port;
    var options = {
        node_master: {networkClient: true, ipcClient: false},
        cluster_master: {networkClient: false, ipcClient: true},
        slicer: {networkClient: false, ipcClient: true},
        worker: {networkClient: true, ipcClient: true}
    };

    var env = process.env;
    var config = {};

    config.clients = options[env.assignment];
    if (config.clients.networkClient) {
        if (env.assignment === 'node_master') {
            host = context.sysconfig.teraslice.master_hostname;
            port = context.sysconfig.teraslice.port;
        }
        if (env.assignment === 'worker') {
            var job = JSON.parse(process.env.job);
            host = job.slicer_hostname;
            port = job.slicer_port;
        }

        config.hostURL = makeHostName(host, port);
    }

    return config;
}

module.exports = function messaging(context, server) {
    var processContext;
    var networkContext;
    var io;
    var networkConfig = {reconnect: true};
    var functionMapping = {};
    var config = makeConfigurations(context);
    var hostURL = config.hostURL;


    if (config.clients.networkClient) {
        //node_master, worker
        io = require('socket.io-client')(hostURL, networkConfig);
    }
    else {
        if (server) {
            //cluster_master
            io = require('socket.io')(server);
        }
        else {
            //slicer
            io = require('socket.io')();
        }
    }

    if (config.clients.ipcClient) {
        //all children of node_master
        processContext = process
    }
    else {
        //node_master
        processContext = context.cluster
    }


    function registerFns(socket) {
        for (var key in functionMapping) {
            socket.on(key, functionMapping[key])
        }
    }

    function initialize() {
        if (io && !config.clients.networkClient) {
            io.on('connection', function(socket) {
                registerFns(socket);
                networkContext = socket;
            });
        }
        else {
            throw new Error('cannot use initialize unless a network connection exists, and the connection is not a client')
        }
    }

    function listen(port) {
        if (io) {
            io.listen(port)
        }
        else {
            throw new Error('cannot use listen to port unless a network connection exists')
        }
    }

    function register(key, fn) {
        if (processMapping[key]) {
            processContext.on(processMapping[key], fn)
        }
        else if (networkMapping[key]) {
            if (config.clients.networkClient) {
                io.on(networkMapping[key], fn)
            }
            else {
                //we attach events etc later when the connection is made, this is async while others are sync registration
                functionMapping[networkMapping[key]] = fn;
            }
        }
        else {
            throw new Error(`Error registering event: "${key}" in messaging model, could not find it, need to define message in message service`)
        }
    }

    function isolateConnection(key, id) {
        decorateConnection(key, id);
        joinRoom(id);
    }

    function decorateConnection(key, value) {
        networkContext[key] = value;
    }

    function getDecoration(key) {
        return networkContext[key]
    }

    function joinRoom(room) {
        networkContext.join(room);
    }

    function send(arg1, arg2, arg3) {
        if (typeof arg1 === 'object') {
            //process msg
            processContext.send(arg1);
            return;
        }
        if (arg3) {
            //id, msg, data
            io.sockets.in(arg1).emit(arg2, arg3);
            return;
        }
        else {
            //msg, data
            io.emit(arg1, arg2);
            return;
        }
    }

    function getHostUrl() {
        if (hostURL) {
            return hostURL
        }
        else {
            return null;
        }
    }

    function getClientCounts() {
        if (io) {
            return io.eio.clientsCount;
        }
        else {
            throw new Error('cannot use getClientCounts function unless a network connection exists')
        }
    }

    function respond(incoming, outgoing) {
        if (incoming._msgID) {
            outgoing._msgID = incoming._msgID;
        }
        send(outgoing);
    }

    //process is an event emitter, we hook through message event, but we register the functions through register
    if (config.clients.ipcClient) {
        process.on('message', function(ipcMessage) {
            process.emit(processMapping[ipcMessage.message], ipcMessage)
        });
    }

    if (!config.clients.ipcClient) {
        processContext.on('online', function(worker) {
            processContext.workers[worker.id].on('message', function(ipcMessage) {
                if (networkMapping[ipcMessage.message]) {
                    send(networkMapping[ipcMessage.message], ipcMessage)
                }
                else {
                    processContext.emit(processMapping[ipcMessage.message], ipcMessage)
                }
            });
        });


    }

    return {
        listen: listen,
        register: register,
        isolateConnection: isolateConnection,
        initialize: initialize,
        decorateConnection: decorateConnection,
        getDecoration: getDecoration,
        getHostUrl: getHostUrl,
        getClientCounts: getClientCounts,
        send: send,
        respond: respond
    }
};
