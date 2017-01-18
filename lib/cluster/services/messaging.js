'use strict';

var makeHostName = require('../../utils/cluster').makeHostName;

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
    'slicer:error:terminal': 'slicer:error:terminal',
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

//needed so slicer can listen for a process message from node master (originally a network call from cluster)
var respondingMapping = {
    'cluster:job:stop': 'cluster:job:stop',
    'cluster:job:pause': 'cluster:job:pause',
    'cluster:job:resume': 'cluster:job:resume',
    'cluster:job:restart': 'cluster:job:restart',
    'cluster:slicer:analytics': 'cluster:slicer:analytics'
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

    config.assignment = env.assignment;

    return config;
}

module.exports = function messaging(context, logger) {
    var processContext;
    var io;
    var networkConfig = {reconnect: true};
    var functionMapping = {};
    var config = makeConfigurations(context);
    logger.debug('messaging service configuration', config);
    var hostURL = config.hostURL;

    if (config.clients.ipcClient) {
        //all children of node_master
        processContext = process
    }
    else {
        //node_master
        processContext = context.cluster
    }


    function registerFns(socket) {
        for (let key in functionMapping) {
            let func = functionMapping[key];
            if (func.__wrapper) {
                socket.on(key, function(msg) {
                    var identifier = func.__wrapper;
                    var id = msg[identifier];
                    //if already set, pass set value into fn, else set it
                    if (socket[identifier]) {
                        id = socket[identifier];
                    }
                    else {
                        socket[identifier] = id;
                    }

                    // if network host (slicer, cluster_master) and connection  or retry event, join room
                    if (key === 'worker:ready' || key === 'node:online' || (msg.retry && key === 'worker:slice:complete')) {
                        logger.debug(`joining room ${id}`);
                        socket.join(id)
                    }

                    //not all events have messages, if so then pass it, else just pass identifier
                    if (msg) {
                        func(msg, id)
                    }
                    else {
                        func(id)
                    }
                })
            }
            else {
                logger.debug(`setting listener key ${key}`);
                socket.on(key, func)
            }
        }
    }

    function send(arg1, arg2, arg3) {
        if (typeof arg1 === 'object') {
            //process msg
            logger.debug(`sending a process message`, arg1);
            processContext.send(arg1);
            return;
        }
        if (arg3) {
            //id, msg, data
            logger.debug(`sending a network message to ${arg1}`, arg2, arg3);

            io.sockets.in(arg1).emit(arg2, arg3);
            return;
        }
        else {
            //msg, data
            logger.debug(`emitting a network message`, arg1, arg2);
            io.emit(arg1, arg2);
            return;
        }
    }

    function initialize(obj) {
        if (obj) {
            var port = obj.port;
            var server = obj.server;
        }

        if (config.clients.networkClient) {
            //node_master, worker
            io = require('socket.io-client')(hostURL, networkConfig);
            registerFns(io);
            logger.debug('client network connection is online')
        }
        else {
            if (server) {
                //cluster_master
                io = require('socket.io')(server);
                io.on('connection', function(socket) {
                    logger.debug(`a node_master has connected`);
                    registerFns(socket);
                });
            }
            else {
                //slicer
                io = require('socket.io')();
                io.on('connection', function(socket) {
                    logger.debug(`a worker has connected`);
                    registerFns(socket);
                });
                io.listen(port);
                logger.debug(`slicer is online and listening on port ${port}`)

            }
        }
    }

    function register(key, fnArg, arg3) {
        var fn = fnArg;
        var id;

        if (arg3) {
            fn = arg3;
            id = fnArg;
        }

        if (processMapping[key] || respondingMapping[key] && config.assignment === 'slicer') {
            var realKey = respondingMapping[key] ? respondingMapping[key] : processMapping[key];

            processContext.on(realKey, fn)
        }
        else if (networkMapping[key]) {
            //we attach events etc later when the connection is made, this is async while others are sync registration
            if (id) {
                fn.__wrapper = id;
                functionMapping[networkMapping[key]] = fn;
            }
            else {
                functionMapping[networkMapping[key]] = fn;
            }
        }
        else {
            throw new Error(`Error registering event: "${key}" in messaging model, could not find it, need to define message in message service`)
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
        //there are no connected clients because the network is not instantiated
        return 0;
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
            var msg = ipcMessage.message;
            var realMsg = processMapping[msg];

            if (respondingMapping[msg] && config.assignment === 'slicer') {
                realMsg = respondingMapping[msg] ? respondingMapping[msg] : processMapping[msg];
            }
            logger.debug(`process emitting ${realMsg}`, ipcMessage);
            process.emit(realMsg, ipcMessage)
        });
    }

    if (!config.clients.ipcClient) {
        processContext.on('online', function(worker) {
            logger.debug('worker has come online');
            processContext.workers[worker.id].on('message', function(ipcMessage) {
                if (networkMapping[ipcMessage.message]) {
                    logger.trace('network passing process message', networkMapping[ipcMessage.message], ipcMessage);

                    send(networkMapping[ipcMessage.message], ipcMessage)
                }
                else {
                    logger.trace('process message', processMapping[ipcMessage.message], ipcMessage);

                    processContext.emit(processMapping[ipcMessage.message], ipcMessage)
                }
            });
        });
    }

    return {
        register: register,
        initialize: initialize,
        getHostUrl: getHostUrl,
        getClientCounts: getClientCounts,
        send: send,
        respond: respond
    }
};
