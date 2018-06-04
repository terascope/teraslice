'use strict';

const _ = require('lodash');
const shortid = require('shortid');
const Promise = require('bluebird');
const Queue = require('queue');

// messages send to cluster_master
const clusterMasterMessages = {
    ipc: {
        'process:SIGTERM': 'SIGTERM',
        'process:SIGINT': 'SIGINT',
        'worker:shutdown': 'worker:shutdown',
        shutdown: 'worker:shutdown'
    },
    intraProcess: {
        'network:disconnect': 'disconnect',
        'network:error': 'error',
    },
    network: {
        'node:online': 'node:online',
        'node:state': 'node:state',
        'execution:recovery:failed': 'execution:recovery:failed',
        'execution:finished': 'execution:finished',
        'cluster:analytics': 'cluster:analytics',
        'execution:error:terminal': 'execution:error:terminal',
        'node:workers:over_allocated': 'node:workers:over_allocated',
        'assets:preloaded': 'assets:preloaded',
        'assets:service:available': 'assets:service:available'
    }
};

const nodeMasterMessages = {
    ipc: {
        'cluster:error:terminal': 'cluster:error:terminal',
        'child:exit': 'exit'
    },
    intraProcess: {
        'network:connect': 'connect',
        'network:disconnect': 'disconnect',
        'network:error': 'error',
    },
    network: {
        'cluster:execution_controller:create': 'cluster:execution_controller:create',
        'cluster:workers:create': 'cluster:workers:create',
        'cluster:workers:remove': 'cluster:workers:remove',
        'cluster:node:state': 'cluster:node:state',
        'cluster:execution:stop': 'cluster:execution:stop',
        'cluster:node:get_port': 'cluster:node:get_port',
        'assets:delete': 'assets:delete',
        'execution_service:verify_assets': 'execution_service:verify_assets'
    }
};

const slicerMessages = {
    ipc: {
        'cluster:execution:pause': 'cluster:execution:pause',
        'cluster:execution:resume': 'cluster:execution:resume',
        'cluster:slicer:analytics': 'cluster:slicer:analytics',
        'worker:shutdown': 'worker:shutdown',
        shutdown: 'worker:shutdown',
        'process:SIGTERM': 'SIGTERM',
        'process:SIGINT': 'SIGINT',
        'assets:loaded': 'assets:loaded'
    },
    intraProcess: {
        'network:disconnect': 'disconnect',
    },
    network: {
        'worker:ready': 'worker:ready',
        'worker:slice:complete': 'worker:slice:complete'
    }
};

const workerMessages = {
    ipc: {
        'worker:shutdown': 'worker:shutdown',
        shutdown: 'worker:shutdown',
        'process:SIGTERM': 'SIGTERM',
        'process:SIGINT': 'SIGINT',
        'assets:loaded': 'assets:loaded'
    },
    intraProcess: {
        'network:connect': 'connect',
        'network:disconnect': 'disconnect',
        'network:error': 'error',
    },
    network: {
        'slicer:slice:new': 'slicer:slice:new',
        'slicer:slice:recorded': 'slicer:slice:recorded',
    }
};

const assetServiceMessages = {
    ipc: {
        'worker:shutdown': 'worker:shutdown'
    },
    network: {}
};

// This deals with messages to workers and slicers of a given execution
const executionMessages = {
    ipc: {
        'assets:loaded': 'assets:loaded',
    },
    network: {}
};

const assetLoaderMessages = {
    ipc: {
        'worker:shutdown': 'worker:shutdown'
    },
    network: {}
};

const allMessages = Object.assign(
    {},
    clusterMasterMessages.network,
    clusterMasterMessages.intraProcess,
    clusterMasterMessages.ipc,
    nodeMasterMessages.network,
    nodeMasterMessages.intraProcess,
    nodeMasterMessages.ipc,
    slicerMessages.network,
    slicerMessages.intraProcess,
    slicerMessages.ipc,
    workerMessages.network,
    workerMessages.intraProcess,
    workerMessages.ipc,
    assetServiceMessages.network,
    assetServiceMessages.ipc,
    executionMessages.network,
    executionMessages.ipc,
    assetLoaderMessages.ipc,
    assetLoaderMessages.network
);


// messaging destination relative towards each process type
const routing = {
    cluster_master: { execution_controller: 'network', node_master: 'network', assets_loader: 'ipc' },
    node_master: {
        cluster_process: 'ipc', cluster_master: 'network', execution_controller: 'ipc', worker: 'ipc', assets_loader: 'ipc', execution: 'ipc'
    },
    execution_controller: { worker: 'network', cluster_master: 'ipc', node_master: 'ipc' },
    worker: { execution_controller: 'network', cluster_master: 'ipc', node_master: 'ipc' },
    assets_loader: { execution: 'ipc', cluster_master: 'ipc' },
    assets_service: { cluster_master: 'ipc' }
};

module.exports = function messaging(context, logger) {
    const networkConfig = { reconnect: true };
    const functionMapping = {};
    // processContext is set in _makeConfigurations
    let processContext;
    const config = _makeConfigurations();
    const { hostURL } = config;
    const configTimeout = context.sysconfig.teraslice.action_timeout;
    const networkLatencyBuffer = context.sysconfig.teraslice.network_latency_buffer;
    const self = config.assignment;
    const events = context.apis.foundation.getSystemEvents();
    const selfMessages = _getMessages(self);
    const messagingQueue = new Queue();

    let messsagingOnline = false;
    let childHookFn = null;
    let io;

    logger.debug('messaging service configuration', config);

    // set a default listener the is used for forwarding/completing responses
    functionMapping['messaging:response'] = _handleResponse;
    processContext.on('messaging:response', _handleResponse);

    function _handleResponse(msgResponse) {
        // if msg has returned to source then emit it else pass it along
        if (msgResponse.__source === config.assignment) {
            logger.debug(`node message ${msgResponse.__msgId} has been processed`);
            // we are in the right spot, emit to complete the promise from send
            events.emit(msgResponse.__msgId, msgResponse);
        } else {
            _forwardMessage(msgResponse);
        }
    }

    function respond(incoming, outgoing) {
        const outgoingResponse = (outgoing && typeof outgoing === 'object') ? outgoing : {};
        if (incoming.__msgId) {
            outgoingResponse.__msgId = incoming.__msgId;
        }
        outgoingResponse.__source = incoming.__source;
        outgoingResponse.message = 'messaging:response';
        outgoingResponse.to = incoming.__source;
        return send(outgoingResponse);
    }

    function isExecutionProcess(process, exId) {
        const { assignment } = process;
        const executionProcess = assignment === 'worker' || assignment === 'execution_controller';
        return process.ex_id === exId && executionProcess;
    }

    function _findAndSend(filterFn, msg, msgHookFn) {
        const childProcesses = context.cluster.workers;
        const children = _.filter(childProcesses, filterFn);
        if (children.length === 0 && msg.response) {
            // if there are no child processes found and it needs a response, answer back so
            // that it does not hold for a long time
            respond(msg);
        }
        children.forEach((childProcess) => {
            if (msgHookFn) msgHookFn(childProcess);
            childProcess.send(msg);
        });
    }

    function _sendToProcesses(msg) {
        const msgExId = msg.ex_id || _.get(msg, 'payload.ex_id');
        if (msg.to === 'execution') {
            const filterFn = process => isExecutionProcess(process, msgExId);
            const msgHookFn = (process) => {
                msg.to = process.assignment;
                // needed for node state so it can show assets
                if (msg.meta) process.assets = msg.meta;
            };
            _findAndSend(filterFn, msg, msgHookFn);
        } else if (msgExId) {
            // all processes that have the same assignment and exId
            const filterFn = process => process.assignment === msg.to && process.ex_id === msgExId;
            _findAndSend(filterFn, msg);
        } else {
            // all processes that have the same assignment
            const filterFn = process => process.assignment === msg.to;
            _findAndSend(filterFn, msg);
        }
    }

    function register(eventConfig) {
        const eventName = eventConfig.event;
        const { callback, identifier } = eventConfig;

        if (allMessages[eventName] === undefined) {
            throw new Error(`Error registering event: "${eventName}" in messaging module, could not find it, need to define message in message service`);
        }
        if (selfMessages.ipc[eventName]) {
            const realKey = selfMessages.ipc[eventName];
            // this needs to be directly allocated so that IPC messaging can happen if
            // network was not instantiated
            processContext.on(realKey, callback);
        } else {
            // we attach events etc later when the connection is made, this is async
            // while others are sync registration
            let trueEventName = selfMessages.network[eventName];

            if (!trueEventName) trueEventName = selfMessages.intraProcess[eventName];
            if (identifier) callback.__socketIdentifier = identifier;
            functionMapping[trueEventName] = callback;
        }
    }

    function _registerFns(socket) {
        _.forOwn(functionMapping, (func, key) => {
            if (func.__socketIdentifier) {
                socket.on(key, (msg) => {
                    const identifier = func.__socketIdentifier;
                    let id = msg[identifier];
                    // if already set, extract value else set it on socket
                    if (socket[identifier]) {
                        id = socket[identifier];
                    } else {
                        socket[identifier] = id;
                    }
                    // if network host (slicer, cluster_master) and connection
                    // or retry event, join room
                    if (key === 'worker:ready' || key === 'node:online' || key === 'moderator:online' || (msg.retry && key === 'worker:slice:complete')) {
                        logger.info(`joining room ${id}`);
                        socket.join(id);
                    }
                    // not all events have messages, if so then pass it, else just pass identifier
                    if (msg) {
                        func(msg, id, identifier);
                    } else {
                        func(id);
                    }
                });
            } else {
                logger.debug(`setting listener key ${key}`);
                socket.on(key, func);
            }
        });
    }

    function _determinePathForMessage(messageSent) {
        const { to } = messageSent;
        let destinationType = routing[self][to];
        // cluster_master has two types of connections to node_master, if it does not have a
        // address then its talking to its own node_master through ipc
        // TODO: reference self message, remove cluster_master specific code
        if (self === 'cluster_master' && !messageSent.address && clusterMasterMessages.ipc[messageSent.message]) {
            destinationType = 'ipc';
        }
        if (destinationType === undefined) {
            throw new Error(`could not determine how to pass on message to: ${JSON.stringify(messageSent)}`);
        }
        return destinationType;
    }

    function listen({ port, server } = {}) {
        messsagingOnline = true;

        if (config.clients.networkClient) {
            // node_master, worker
            io = require('socket.io-client')(hostURL, networkConfig);
            _registerFns(io);
            if (self === 'node_master') {
                io.on('networkMessage', (networkMsg) => {
                    const { message } = networkMsg;
                    const func = functionMapping[message];
                    if (func) {
                        func(networkMsg);
                    } else {
                        // if no function is registered, it is meant to by passed along to child
                        _sendToProcesses(networkMsg);
                    }
                });
            }
            logger.debug('client network connection is online');
        } else if (server) {
            // cluster_master
            io = require('socket.io')(server);
            io.on('connection', (socket) => {
                logger.debug('a connection to cluster_master has been made');
                _registerFns(socket);
            });
        } else {
            // execution_controller
            io = require('socket.io')();
            io.on('connection', (socket) => {
                logger.debug('a worker has connected');
                _registerFns(socket);
            });

            io.listen(port);
            logger.debug(`execution_controller is online and listening on port ${port}`);
        }
        // TODO: message queuing will be used until formal process lifecycles are implemented
        while (messagingQueue.size() > 0) {
            const cachedMessages = messagingQueue.dequeue();
            // they are put in as a tuple, [realMsg, ipcMessage]
            processContext.emit(cachedMessages[0], cachedMessages[1]);
        }
    }

    function broadcast(eventName, sentData) {
        logger.debug('emitting a network message', eventName, sentData);
        const payload = sentData || {};
        if (!payload.message) payload.message = eventName;
        io.emit('networkMessage', payload);
    }

    function _forwardMessage(messageSent) {
        const messageType = _determinePathForMessage(messageSent);
        if (messageType === 'network') {
            // worker and node_master communicate through broadcast to slicer/cluster_master
            if (self === 'worker' || self === 'node_master') {
                io.emit(messageSent.message, messageSent);
            } else if (self === 'cluster_master') {
                io.sockets.in(messageSent.address).emit('networkMessage', messageSent);
            } else {
                io.sockets.in(messageSent.address).emit(messageSent.message, messageSent);
            }
        } else if (self === 'node_master') {
            _sendToProcesses(messageSent);
        } else {
            processContext.send(messageSent);
        }
    }

    function send(messageSent) {
        if (!messageSent.__source) messageSent.__source = self;
        const needsReply = messageSent.response;

        if (!needsReply) {
            _forwardMessage(messageSent);
            return Promise.resolve(true);
        }
        return new Promise(((resolve, reject) => {
            const msgID = shortid.generate();
            const actionTimeout = messageSent.timeout || configTimeout;
            const messageTimeout = _.toNumber(actionTimeout) + networkLatencyBuffer;
            messageSent.__msgId = msgID;

            events.once(msgID, (nodeMasterData) => {
                if (nodeMasterData.error) {
                    reject(`Error: ${nodeMasterData.error} occurred on node: ${nodeMasterData.__source}`);
                } else {
                    resolve(nodeMasterData);
                }
            });

            _forwardMessage(messageSent);
            setTimeout(() => {
                // remove listener to prevent memory leaks
                events.removeAllListeners(msgID);
                reject(`timeout error while communicating with ${messageSent.to}, msg: ${messageSent.message}, data: ${JSON.stringify(messageSent)}`);
            }, messageTimeout);
        }));
    }

    function _makeConfigurations() {
        let host;
        let port;
        const options = {
            node_master: { networkClient: true, ipcClient: false },
            cluster_master: { networkClient: false, ipcClient: true },
            execution_controller: { networkClient: false, ipcClient: true },
            worker: { networkClient: true, ipcClient: true },
            moderator: { networkClient: true, ipcClient: true },
            assets_loader: { networkClient: false, ipcClient: true },
            assets_service: { networkClient: true, ipcClient: true }
        };

        const env = context.__testingModule ? context.__testingModule.env : process.env;
        const processConfig = {};
        processConfig.clients = options[env.assignment];

        if (processConfig.clients.ipcClient) {
            // all children of node_master
            processContext = context.__testingModule ? context.__testingModule : process;
        } else {
            // node_master
            processContext = context.cluster;
        }

        if (processConfig.clients.networkClient) {
            if (env.assignment === 'node_master' || env.assignment === 'moderator' || env.assignment === 'assets_service') {
                host = context.sysconfig.teraslice.master_hostname;
                port = context.sysconfig.teraslice.port; // eslint-disable-line
            }
            if (env.assignment === 'worker') {
                const job = JSON.parse(processContext.env.job);
                host = job.slicer_hostname;
                port = job.slicer_port;
            }
            processConfig.hostURL = _makeHostName(host, port);
        }

        processConfig.assignment = env.assignment;

        return processConfig;
    }

    function _makeHostName(host, port, nameSpace) {
        let name;
        let hostname = host;

        if (!hostname.match(/http/)) {
            hostname = `http://${hostname}`;
        }

        const lastChar = hostname[hostname.length - 1];

        if (lastChar !== ':') {
            name = `${hostname}:${port}`;
        } else {
            name = hostname + port;
        }

        if (nameSpace) {
            return `${name}/${nameSpace}`;
        }

        return name;
    }

    function _getMessages(type) {
        if (type === 'cluster_master') return clusterMasterMessages;
        if (type === 'node_master') return nodeMasterMessages;
        if (type === 'execution_controller') return slicerMessages;
        if (type === 'worker') return workerMessages;
        if (type === 'assets_service') return assetServiceMessages;
        if (type === 'assets_loader') return assetLoaderMessages;
        return new Error(`could not find message model for type: ${type}`);
    }

    function getHostUrl() {
        if (hostURL) {
            return hostURL;
        }
        return null;
    }

    function getClientCounts() {
        if (io) {
            return io.eio.clientsCount;
        }
        // there are no connected clients because the network is not instantiated
        return 0;
    }

    function registerChildOnlineHook(fn) {
        childHookFn = fn;
    }

    function isExecutionStateQuery(msg) {
        const stateQuery = {
            'cluster:execution:pause': 'cluster:execution:pause',
            'cluster:execution:resume': 'cluster:execution:resume',
            'cluster:slicer:analytics': 'cluster:slicer:analytics',
        };

        return stateQuery[msg] !== undefined;
    }

    function emitIpcMessage(fn) {
        return (ipcMessage) => {
            const msg = ipcMessage.message;
            const realMsg = _.get(selfMessages, `ipc.${msg}`, null);
            if (realMsg) {
                fn(realMsg, ipcMessage);
            } else {
                logger.error(`process: ${self} has received a message: ${msg}, which is not registered in the messaging module`);
            }
        };
    }

    function handleIpcMessages() {
        if (self === 'execution_controller') {
            const checkAndEmit = (realMsg, ipcMessage) => {
                if (messsagingOnline || !isExecutionStateQuery(realMsg)) {
                    processContext.emit(realMsg, ipcMessage);
                } else {
                    messagingQueue.enqueue([realMsg, ipcMessage]);
                }
            };
            return emitIpcMessage(checkAndEmit);
        }
        // for everything else just emit the message
        const emitFn = (realMsg, ipcMessage) => processContext.emit(realMsg, ipcMessage);
        return emitIpcMessage(emitFn);
    }


    // all child processes need to set up a process listener on the 'message' event
    if (config.clients.ipcClient) {
        process.on('message', handleIpcMessages());
    } else {
        processContext.on('online', (worker) => {
            logger.debug('worker has come online');
            if (childHookFn) {
                childHookFn();
            }
            const contextWorker = processContext.workers[worker.id];

            // don't double subscribe
            contextWorker.removeListener('message', _handleWorkerMessage);

            // set up a message handler on each child created, if a child is talking to cluster
            // then pass it on, else invoke process event handler on node_master
            contextWorker.on('message', _handleWorkerMessage);
        });
    }

    function _handleWorkerMessage(ipcMessage) {
        if (ipcMessage.to === 'cluster_master') {
            logger.trace('network passing process message', ipcMessage.message, ipcMessage);
            send(ipcMessage);
        } else if (ipcMessage.to === 'node_master') {
            logger.trace('process message', ipcMessage.message, ipcMessage);
            processContext.emit(ipcMessage.message, ipcMessage);
        } else {
            _sendToProcesses(ipcMessage);
        }
    }

    function testContext(_io) {
        if (_io) io = _io;

        return {
            _sendToProcesses,
            _registerFns,
            _determinePathForMessage,
            _forwardMessage,
            _makeConfigurations,
            _makeHostName,
            _getMessages,
            _handleResponse,
            _getRegistry: () => functionMapping,
            routing
        };
    }

    return {
        register,
        listen,
        getHostUrl,
        getClientCounts,
        send,
        respond,
        broadcast,
        registerChildOnlineHook,
        __test_context: testContext
    };
};
