'use strict';

const _ = require('lodash');
const shortid = require('shortid');


// TODO: be careful of node:state, its emitted from both sides
// TODO: 'node:message:processed' needs to be reviewed, hopefully eliminated, others may need
// TODO: shutdown is from terafoundation, make sure it works
// TODO: check to see if assets:preloaded is in the right spot on cluster messages
const clusterMasterMessages = {
    ipc: {
        'process:SIGTERM': 'SIGTERM',
        'process:SIGINT': 'SIGINT',
        'worker:shutdown': 'worker:shutdown',
        shutdown: 'worker:shutdown',
    },
    network: {
        'network:disconnect': 'disconnect',
        'network:error': 'error',
        'node:online': 'node:online',
        'node:state': 'node:state',
        'node:message:processed': 'node:message:processed',
        'slicer:recovery:failed': 'slicer:recovery:failed',
        'slicer:job:finished': 'slicer:job:finished',
        'cluster:analytics': 'cluster:analytics',
        'job:error:terminal': 'job:error:terminal',
        'node:workers:over_allocated': 'node:workers:over_allocated',
        'assets:preloaded': 'assets:preloaded'
    }
};
// TODO: jobs_service:verify_assets technically is for asset_loader but the process is not made yet
// TODO: is job stop really here? i think so
const nodeMasterMessages = {
    ipc: {
        'cluster:error:terminal': 'cluster:error:terminal',
        'child:exit': 'exit'
    },
    network: {
        'network:connect': 'connect',
        'network:disconnect': 'disconnect',
        'network:error': 'error',
        'cluster:slicer:create': 'cluster:slicer:create',
        'cluster:workers:create': 'cluster:workers:create',
        'cluster:workers:remove': 'cluster:workers:remove',
        'cluster:node:state': 'cluster:node:state',
        'cluster:job:stop': 'cluster:job:stop',
        'cluster:job:restart': 'cluster:job:restart',
        'cluster:node:get_port': 'cluster:node:get_port',
        'assets:delete': 'assets:delete',
        'execution_service:verify_assets': 'execution_service:verify_assets'
    }
};

const slicerMessages = {
    ipc: {
        'cluster:job:pause': 'cluster:job:pause',
        'cluster:job:resume': 'cluster:job:resume',
        'cluster:job:restart': 'cluster:job:restart',
        'cluster:slicer:analytics': 'cluster:slicer:analytics',
        'assets:loaded': 'assets:loaded',
        'worker:shutdown': 'worker:shutdown',
        shutdown: 'worker:shutdown',
        'process:SIGTERM': 'SIGTERM',
        'process:SIGINT': 'SIGINT',
    },
    network: {
        'network:disconnect': 'disconnect',
        'worker:ready': 'worker:ready',
        'worker:slice:complete': 'worker:slice:complete',
    }
};

const workerMessages = {
    ipc: {
        'assets:loaded': 'assets:loaded',
        'worker:shutdown': 'worker:shutdown',
        shutdown: 'worker:shutdown',
        'process:SIGTERM': 'SIGTERM',
        'process:SIGINT': 'SIGINT'
    },
    network: {
        'network:connect': 'connect',
        'network:disconnect': 'disconnect',
        'network:error': 'error',
        'slicer:slice:new': 'slicer:slice:new',
        'slicer:slice:recorded': 'slicer:slice:recorded',
    }
};

// TODO: what goes here?
const assetsLoader = {};
const assetService = {};

// shutdown is a process message from terafoundation
const processMapping = {
    'process:SIGTERM': 'SIGTERM',
    'process:SIGINT': 'SIGINT',
    'child:exit': 'exit',
    'worker:shutdown': 'worker:shutdown',
    shutdown: 'worker:shutdown',
    'assets:loaded': 'assets:loaded',
    'jobs_service:verify_assets': 'jobs_service:verify_assets',
    'assets:preloaded': 'assets:preloaded',
    'assets:service:available': 'assets:service:available'
};

// TODO check out if we still need this after refactor
// needed so slicer can listen for a process message from node master
const respondingMapping = {
    'cluster:job:stop': 'cluster:job:stop',
    'cluster:job:pause': 'cluster:job:pause',
    'cluster:job:resume': 'cluster:job:resume',
    'cluster:job:restart': 'cluster:job:restart',
    'cluster:slicer:analytics': 'cluster:slicer:analytics'
};
// TODO: refactor to remove respondingMapping
const allMessages = Object.assign(
    {},
    clusterMasterMessages.network,
    clusterMasterMessages.ipc,
    nodeMasterMessages.network,
    nodeMasterMessages.ipc,
    slicerMessages.network,
    slicerMessages.ipc,
    workerMessages.network,
    workerMessages.ipc,
    respondingMapping
);


// messaging destination relative towards each process type
const routing = {
    cluster_master: { slicer: 'network', node_master: 'ipc', assets_loader: 'ipc' },
    node_master: { cluster_master: 'network', slicer: 'ipc', worker: 'ipc', assets_loader: 'ipc' },
    slicer: { worker: 'network', cluster_master: 'ipc', node: 'ipc' },
    worker: { slicer: 'network', cluster_master: 'ipc', node: 'ipc' },
    assets_loader: {}
};

module.exports = function messaging(context, logger, childHookFn) {
    const networkConfig = { reconnect: true };
    const functionMapping = {};
    const config = makeConfigurations();
    const hostURL = config.hostURL;
    const events = context.apis.foundation.getSystemEvents();
    const configTimeout = context.sysconfig.teraslice.network_timeout;
    const self = config.assignment;
    const selfMessages = getMessages(self);
    let processContext;
    let io;

    logger.debug('messaging service configuration', config);

    if (config.clients.ipcClient) {
        // all children of node_master
        processContext = context.__testingModule ? context.__testingModule : process;
    } else {
        // node_master
        processContext = context.cluster;
    }

    function register(key, fnArg, arg3) {
        let fn = fnArg;
        let id;

        if (arg3) {
            fn = arg3;
            id = fnArg;
        }
        if (allMessages[key] === undefined) {
            throw new Error(`Error registering event: "${key}" in messaging module, could not find it, need to define message in message service`);
        }
        // TODO check this, assets:loaded and others, need to differentiate types
        if (selfMessages.ipc[key] || (respondingMapping[key] && config.assignment === 'slicer')) {
            const realKey = respondingMapping[key] ? respondingMapping[key] : selfMessages.ipc[key];
            // this needs to be directly allocated so that IPC messaging can happen if
            // network was not instantiated
            processContext.on(realKey, fn);
        } else if (id) {
            // we attach events etc later when the connection is made, this is async
            // while others are sync registration
            fn.__wrapper = id;
            functionMapping[selfMessages.network[key]] = fn;
        } else {
            functionMapping[selfMessages.network[key]] = fn;
        }
    }

    function registerFns(socket) {
        _.forOwn(functionMapping, (func, key) => {
            if (func.__wrapper) {
                socket.on(key, (msg) => {
                    const wrapper = func.__wrapper;
                    let identifier;
                    let id;

                    if (typeof wrapper === 'string') {
                        identifier = wrapper;
                        id = msg[identifier];
                        // if already set, extract value else set it on socket
                        if (socket[identifier]) {
                            id = socket[identifier];
                        } else {
                            socket[identifier] = id;
                        }
                    } else {
                        // this is only used by cluster_master disconnect event so far to
                        // determine which services are exiting
                        wrapper.forEach((tag) => {
                            if (socket[tag]) {
                                identifier = tag;
                                id = socket[tag];
                            }
                        });
                    }

                    // if network host (slicer, cluster_master) and connection
                    // or retry event, join room

                    if (key === 'worker:ready' || key === 'node:online' || key === 'moderator:online' || (msg.retry && key === 'worker:slice:complete')) {
                        logger.warn(`joining room ${id}`);
                        socket.join(id);
                    }

                    // not all events have messages, if so then pass it, else just pass identifier
                    if (msg) {
                        func(msg, id, identifier);
                    } else {
                        func(id);
                    }
                    // If there is a destination and the current process is not it, forward it on
                    // TODO: might need to alter msg inbetween stuff
                    if (msg.to) {
                        if (msg.to !== config.assignment) {
                            const messageType = determinePathForMessage(msg.to);
                            if (messageType === 'network') {
                                io.sockets.in(msg.to).emit(msg.message, msg);
                            } else {
                                processContext.send(msg);
                            }
                        }
                    }
                });
            } else {
                logger.debug(`setting listener key ${key}`);
                socket.on(key, func);
            }
        });
    }

    function broadcast(eventName, payload) {
        logger.debug('emitting a network message', eventName, payload);
        io.emit(eventName, payload);
    }

    function determinePathForMessage(to) {
        const destinationType = routing[self][to];
        // TODO: this hack is not right
        if (destinationType === undefined) {
            // cluster master can talk to a specific node, the to references a specific hostname
            if (self === 'cluster_master' || 'slicer') {
                return 'network';
            }
            throw new Error(`could not determine how to pass on message to: ${to}`);
        }
        return destinationType;
    }

    function send(messageSent) {
        if (messageSent.to === undefined) {
            // process msg
            logger.debug('sending a process message', messageSent);
            processContext.send(messageSent);
            // TODO: might need transactional here as well
            return Promise.resolve(true);
        }
        const needsReply = messageSent.reply;
        if (needsReply !== undefined && needsReply === false) {
            const messageType = determinePathForMessage(messageSent.to);

            if (messageType === 'network') {
                io.sockets.in(messageSent.to).emit(messageSent.message, messageSent);
                return Promise.resolve(true);
            }

            processContext.send(messageSent);
            return Promise.resolve(true);
        }
        return new Promise(((resolve, reject) => {
            const msgID = shortid.generate();
            const messageType = determinePathForMessage(messageSent.to);
            messageSent._msgID = msgID;

            events.on(msgID, (nodeMasterData) => {
                // remove listener to prevent memory leaks
                events.removeAllListeners(msgID);
                if (nodeMasterData.error) {
                    reject(`Error: ${nodeMasterData.error} occurred on node: ${nodeMasterData.node_id}`);
                } else {
                    resolve(nodeMasterData);
                }
            });

            if (messageType === 'network') {
                io.sockets.in(messageSent.to).emit(messageSent.message, messageSent);
            } else {
                processContext.send(messageSent);
            }

            setTimeout(() => {
                // remove listener to prevent memory leaks
                events.removeAllListeners(msgID);
                reject(`timeout error while communicating with node: ${messageSent.to}, msg: ${messageSent.message}, data: ${JSON.stringify(messageSent)}`);
            }, configTimeout);
        }));
    }

    function makeConfigurations() {
        let host;
        let port;
        const options = {
            node_master: { networkClient: true, ipcClient: false },
            cluster_master: { networkClient: false, ipcClient: true },
            slicer: { networkClient: false, ipcClient: true },
            worker: { networkClient: true, ipcClient: true },
            moderator: { networkClient: true, ipcClient: true },
            assets_loader: { networkClient: false, ipcClient: true },
            assets_service: { networkClient: true, ipcClient: true }
        };

        const env = context.__testingModule ? context.__testingModule.env : process.env;
        const processConfig = {};

        processConfig.clients = options[env.assignment];
        if (processConfig.clients.networkClient) {
            if (env.assignment === 'node_master' || env.assignment === 'moderator' || env.assignment === 'assets_service') {
                host = context.sysconfig.teraslice.master_hostname;
                port = context.sysconfig.teraslice.port;
            }
            if (env.assignment === 'worker') {
                const job = JSON.parse(process.env.job);
                host = job.slicer_hostname;
                port = job.slicer_port;
            }
            processConfig.hostURL = makeHostName(host, port);
        }

        processConfig.assignment = env.assignment;

        return processConfig;
    }

    function makeHostName(host, port, nameSpace) {
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

    // TODO: review this, looks messy
    function initialize(obj) {
        let port;
        let server;

        if (obj) {
            port = obj.port;
            server = obj.server;
        }

        if (config.clients.networkClient) {
            // node_master, worker
            io = require('socket.io-client')(hostURL, networkConfig);
            registerFns(io);
            logger.debug('client network connection is online');
        } else if (server) {
            // cluster_master
            io = require('socket.io')(server);
            io.on('connection', (socket) => {
                logger.debug('a connection to cluster_master has been made');
                registerFns(socket);
            });
        } else {
            // slicer
            io = require('socket.io')();
            io.on('connection', (socket) => {
                logger.debug('a worker has connected');
                registerFns(socket);
            });

            io.listen(port);
            logger.debug(`slicer is online and listening on port ${port}`);
        }
    }

    function getMessages(type) {
        if (type === 'cluster_master') return clusterMasterMessages;
        if (type === 'node_master') return nodeMasterMessages;
        if (type === 'slicer') return slicerMessages;
        if (type === 'worker') return workerMessages;
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

    function respond(incoming, outgoing) {
        if (incoming._msgID) {
            outgoing._msgID = incoming._msgID;
        }
        send(outgoing);
    }

    // all child processes need to set up a process listener on the 'message' event
    if (config.clients.ipcClient) {
        process.on('message', (ipcMessage) => {
            const msg = ipcMessage.message;
            // convert to proper message handle
            let realMsg = selfMessages.ipc[msg];

            if (respondingMapping[msg] && config.assignment === 'slicer') {
                realMsg = respondingMapping[msg] ? respondingMapping[msg] : processMapping[msg];
            }
            logger.debug(`process emitting ${realMsg}`, ipcMessage);
            // process is an event emitter, the events are set during register
            process.emit(realMsg, ipcMessage);
        });
    }

    // for node_master only
    if (!config.clients.ipcClient) {
        processContext.on('online', (worker) => {
            logger.debug('worker has come online');
            if (childHookFn) {
                childHookFn();
            }
            // set up a message handler on each child created, if a child is taling to cluster
            // then pass it on, else invoke process event handler on node_master
            processContext.workers[worker.id].on('message', (ipcMessage) => {
                if (ipcMessage.to === 'cluster_master') {
                    logger.trace('network passing process message', ipcMessage.message, ipcMessage);
                    broadcast(ipcMessage.message, ipcMessage);
                } else {
                    logger.trace('process message', ipcMessage.message, ipcMessage);
                    processContext.emit(ipcMessage.message, ipcMessage);
                }
            });
        });
    }

    return {
        register,
        initialize,
        getHostUrl,
        getClientCounts,
        send,
        respond,
        broadcast
    };
};
