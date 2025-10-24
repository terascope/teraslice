/* eslint-disable prefer-const */
import type { EventEmitter } from 'node:events';
import type { Server as HttpServer } from 'node:http';
import type { Server as HttpsServer } from 'node:https';
import { nanoid } from 'nanoid';
import {
    pDelay, Logger, isFunction,
    isEmpty, get, toNumber, isKey
} from '@terascope/core-utils';
import { Queue } from '@terascope/entity-utils';
import { Context } from '@terascope/job-components';
import socketIOClient from 'socket.io-client';
import socketIOServer from 'socket.io';
import { isProcessAssignment, MessagingConfigOptions, ProcessAssignment } from '../../../../../../interfaces.js';

// messages send to cluster_master
const clusterMasterMessages = {
    ipc: {
        'process:SIGTERM': 'SIGTERM',
        'process:SIGINT': 'SIGINT',
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
    }
};

const assetServiceMessages = {
    ipc: {
        'process:SIGTERM': 'SIGTERM',
        'process:SIGINT': 'SIGINT',
    },
    network: {}
};

// messaging destination relative towards each process type
export const routing = Object.freeze({
    cluster_master: {
        node_master: 'network',
    },
    node_master: {
        cluster_process: 'ipc',
        cluster_master: 'network',
    },
    assets_service: {
        cluster_master: 'ipc'
    }
});

type HookFN = () => void | null;

type ListenOptions = {
    server?: HttpServer | HttpsServer;
    port?: string | number;
    query?: { node_id: string };
};

export class Messaging {
    context: Context;
    logger: Logger;
    events: EventEmitter;
    configTimeout: number;
    networkLatencyBuffer: number;
    hostURL: string;
    messsagingOnline = false;
    messagingQueue = new Queue<any>();
    childHookFn: HookFN;
    config: any;
    self: string;
    selfMessages: Record<string, any>;
    processContext!: Record<string, any>;
    functionMapping: Record<string, any>;
    io!: Record<string, any>;

    constructor(context: Context, logger: Logger, __io?: any) {
        if (__io) {
            this.io = __io;
        }
        this.context = context;
        this.functionMapping = {};
        // processContext is set in _makeConfigurations
        this.config = this._makeConfigurations() as any;
        const { hostURL } = this.config;
        this.hostURL = hostURL;
        this.configTimeout = context.sysconfig.teraslice.action_timeout;
        this.networkLatencyBuffer = context.sysconfig.teraslice.network_latency_buffer;
        this.self = this.config.assignment;
        this.events = context.apis.foundation.getSystemEvents();
        this.selfMessages = this._getMessages(this.self);
        this.logger = logger;
        // @ts-expect-error TODO: fixme
        this.childHookFn = null;

        this.logger.debug(`messaging service configuration for assignment ${this.config.assignment}`);

        // set a default listener the is used for forwarding/completing responses
        this.functionMapping['messaging:response'] = this._handleResponse.bind(this);
        this.processContext.on('messaging:response', this._handleResponse.bind(this));

        // all child processes need to set up a process listener on the 'message' event
        if (this.config.clients.ipcClient) {
            process.on('message', this._handleIpcMessages().bind(this));
        } else {
            this.processContext.on('online', (worker: NodeJS.Process) => {
                this.logger.debug('worker process has come online');
                if (this.childHookFn) {
                    this.childHookFn();
                }
                // @ts-expect-error
                const contextWorker = this.processContext.workers[worker.id];

                // don't double subscribe
                contextWorker.removeListener('message', this._handleWorkerMessage.bind(this));

                // set up a message handler on each child created, if a child is talking to cluster
                // then pass it on, else invoke process event handler on node_master
                contextWorker.on('message', this._handleWorkerMessage.bind(this));
            });
        }
    }

    private _handleResponse(msgResponse: any) {
        // if msg has returned to source then emit it else pass it along
        if (msgResponse.__source === this.config.assignment) {
            this.logger.trace(`node message ${msgResponse.__msgId} has been processed`);
            // we are in the right spot, emit to complete the promise from send
            this.events.emit(msgResponse.__msgId, msgResponse);
        } else {
            this._forwardMessage(msgResponse);
        }
    }

    respond(incoming: any, outgoing?: any) {
        const outgoingResponse = (outgoing && typeof outgoing === 'object') ? outgoing : {};
        if (incoming.__msgId) {
            outgoingResponse.__msgId = incoming.__msgId;
        }
        outgoingResponse.__source = incoming.__source;
        outgoingResponse.message = 'messaging:response';
        outgoingResponse.to = incoming.__source;
        return this.send(outgoingResponse);
    }

    private _findAndSend(filterFn: any, msg: any, msgHookFn?: any) {
        const childProcesses = this.context.cluster.workers;
        const children = Object.values(childProcesses).filter(filterFn);

        if (children.length === 0 && msg.response) {
            // if there are no child processes found and it needs a response, answer back so
            // that it does not hold for a long time
            this.respond(msg);
        }

        children.forEach((childProcess) => {
            if (msgHookFn) msgHookFn(childProcess);
            // @ts-expect-error
            if (childProcess.connected) {
                childProcess.send(msg);
            } else {
                this.logger.warn('cannot send message to process', msg);
            }
        });
    }

    private _sendToProcesses(msg: any) {
        const msgExId = msg.ex_id || get(msg, 'payload.ex_id');
        if (msgExId) {
            // all processes that have the same assignment and exId
            const filterFn = (process: any) => {
                if (process.assignment !== msg.to) return false;
                if (process.ex_id !== msgExId) return false;
                return true;
            };
            this._findAndSend(filterFn, msg);
        } else {
            // all processes that have the same assignment
            const filterFn = (process: any) => process.assignment === msg.to;
            this._findAndSend(filterFn, msg);
        }
    }

    register(eventConfig: Record<string, any>) {
        const eventName = eventConfig.event;
        const { callback, identifier } = eventConfig;

        const selfHasEvent = Object.values(this.selfMessages)
            .some((type) => type[eventName] != null);

        if (!selfHasEvent) {
            throw new Error(`"${self}" cannot register for event, "${eventName}", in messaging module`);
        }

        if (this.selfMessages.ipc[eventName]) {
            const realKey = this.selfMessages.ipc[eventName];
            // this needs to be directly allocated so that IPC messaging can happen if
            // network was not instantiated
            this.processContext.on(realKey, callback);
        } else {
            // we attach events etc later when the connection is made, this is async
            // while others are sync registration
            let trueEventName = this.selfMessages.network[eventName];

            if (!trueEventName) {
                trueEventName = this.selfMessages.intraProcess[eventName];
            }

            if (identifier) {
                callback.__socketIdentifier = identifier;
            }

            this.functionMapping[trueEventName] = callback;
        }
    }

    private _registerFns(socket: any) {
        for (const [key, func] of Object.entries(this.functionMapping)) {
            if (func.__socketIdentifier) {
                const wrappedFunc = (msg: Record<string, any> = {}) => {
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
                    if (key === 'node:online') {
                        const rooms = Object.keys(socket.rooms);
                        const hasRoom = rooms.some((r) => r === id);
                        if (!hasRoom) {
                            this.logger.info(`joining room ${id}`);
                            socket.join(id);
                        }
                    }
                    // not all events have messages, if so then pass it, else just pass identifier
                    if (msg) {
                        func(msg, id, identifier);
                    } else {
                        func(id);
                    }
                };

                socket.on(key, wrappedFunc);
            } else {
                this.logger.trace(`setting listener key ${key}`);
                socket.on(key, func);
            }
        }
    }

    private _determinePathForMessage(messageSent: any) {
        const { to } = messageSent;
        let destinationType: string | undefined = undefined;

        if (isKey(routing, this.self) && isKey(routing[this.self], to)) {
            destinationType = routing[this.self][to];
        }
        // cluster_master has two types of connections to node_master, if it does not have a
        // address then its talking to its own node_master through ipc
        // TODO: reference self message, remove cluster_master specific code
        if (this.self === 'cluster_master' && !messageSent.address && (messageSent.message in clusterMasterMessages.ipc)) {
            destinationType = 'ipc';
        }
        if (destinationType === undefined) {
            throw new Error(`could not determine how to pass on message to: ${JSON.stringify(messageSent)}`);
        }
        return destinationType;
    }

    // join rooms before on connect to avoid race conditions
    private _attachRoomsSocketIO() {
        if (!this.io) return;

        // middleware
        this.io.use((socket: any, next: any) => {
            const {
                node_id: nodeId,
            } = socket.handshake.query;

            if (nodeId) {
                this.logger.info(`node ${nodeId} joining room on connect`);
                socket.join(nodeId);
            }

            return next();
        });
    }

    private _createIOServer(options: ListenOptions) {
        const { server, port } = options;

        const opts = {
            path: '/native-clustering',
            pingTimeout: this.configTimeout,
            pingInterval: this.configTimeout + this.networkLatencyBuffer,
            perMessageDeflate: false,
            serveClient: false,
        };
        if (server) {
            this.io = socketIOServer(server, opts);
        } else if (port) {
            this.io = socketIOServer(port, opts);
        }
        this._attachRoomsSocketIO();

        this.io.on('connection', (socket: any) => {
            this.logger.debug('a connection to cluster_master has been made');
            this._registerFns(socket);
        });
    }

    listen(options: ListenOptions = {}) {
        const { query } = options;
        this.messsagingOnline = true;

        if (this.config.clients.networkClient) {
            // node_master, worker
            this.io = socketIOClient(this.hostURL, {
                forceNew: true,
                path: '/native-clustering',
                query
            });

            this._registerFns(this.io);

            if (this.self === 'node_master') {
                this.io.on('networkMessage', (networkMsg: any) => {
                    const { message } = networkMsg;
                    const func = this.functionMapping[message];
                    if (func) {
                        func(networkMsg);
                    } else {
                        // if no function is registered, it is meant to by passed along to child
                        this._sendToProcesses(networkMsg);
                    }
                });
            }

            this.logger.debug('client network connection is online');
        } else {
            // cluster_master and test processes
            this._createIOServer(options);
        }

        // TODO: message queuing will be used until formal process lifecycles are implemented
        while (this.messagingQueue.size() > 0) {
            const cachedMessages = this.messagingQueue.dequeue();
            // they are put in as a tuple, [realMsg, ipcMessage]
            this.processContext.emit(cachedMessages[0], cachedMessages[1]);
        }
    }

    broadcast(eventName: string, payload: Record<string, any> = {}) {
        this.logger.trace('broadcasting a network message', { eventName, payload });
        if (!payload.message) {
            payload.message = eventName;
        }
        this.io.emit('networkMessage', payload);
    }

    private _forwardMessage(messageSent: any) {
        const messageType = this._determinePathForMessage(messageSent);
        if (messageType === 'network') {
            // worker and node_master communicate through broadcast to slicer/cluster_master
            if (this.self === 'node_master') {
                this.io.emit(messageSent.message, messageSent);
            } else if (this.self === 'cluster_master') {
                this.io.sockets.in(messageSent.address).emit('networkMessage', messageSent);
            } else {
                this.io.sockets.in(messageSent.address).emit(messageSent.message, messageSent);
            }
        } else if (this.self === 'node_master') {
            this._sendToProcesses(messageSent);
        } else if (this.processContext) {
            if (this.processContext.connected) {
                this.processContext.send(messageSent);
            } else {
                this.logger.warn('cannot send to process because it is not connected', messageSent);
            }
        }
    }

    send(messageSent: any) {
        if (!messageSent.__source) {
            messageSent.__source = this.self;
        }
        const needsReply = messageSent.response;

        if (!needsReply) {
            this._forwardMessage(messageSent);
            return Promise.resolve(true);
        }
        return new Promise((resolve, reject) => {
            let timer: NodeJS.Timeout | undefined;
            const msgID = nanoid(8);
            const actionTimeout = messageSent.timeout || this.configTimeout;
            const messageTimeout = toNumber(actionTimeout) + this.networkLatencyBuffer;
            messageSent.__msgId = msgID;

            this.events.once(msgID, (nodeMasterData) => {
                clearTimeout(timer);
                if (nodeMasterData.error) {
                    reject(new Error(`${nodeMasterData.error} occurred on node: ${nodeMasterData.__source}`));
                } else {
                    resolve(nodeMasterData);
                }
            });

            this._forwardMessage(messageSent);

            timer = setTimeout(() => {
                // remove listener to prevent memory leaks
                this.events.removeAllListeners(msgID);
                reject(new Error(`timeout error while communicating with ${messageSent.to}, msg: ${messageSent.message}, data: ${JSON.stringify(messageSent)}`));
            }, messageTimeout);
        });
    }

    private _makeConfigurations() {
        let host;
        let port;
        const options: MessagingConfigOptions = {
            node_master: { networkClient: true, ipcClient: false },
            cluster_master: { networkClient: false, ipcClient: true },
            execution_controller: { networkClient: false, ipcClient: true },
            worker: { networkClient: true, ipcClient: true },
            assets_service: { networkClient: true, ipcClient: true }
        };
        // @ts-expect-error
        const env = this.context.__testingModule ? this.context.__testingModule.env : process.env;
        const processConfig: Record<string, any> = {};
        // @ts-expect-error
        const testProcess = this.context.__testingModule;
        const { assignment } = env;
        if (!isProcessAssignment(assignment)) {
            throw new Error(`assignment must be on of: ${Object.values(ProcessAssignment).toString()}. Received ${assignment}`);
        }
        processConfig.clients = options[assignment];

        if (processConfig.clients.ipcClient) {
            // all children of node_master
            this.processContext = testProcess ? testProcess : process;
        } else {
            // node_master
            this.processContext = this.context.cluster;
        }

        if (processConfig.clients.networkClient) {
            if (assignment === 'node_master' || assignment === 'assets_service') {
                host = this.context.sysconfig.teraslice.master_hostname;
                ({ port } = this.context.sysconfig.teraslice);
            }
            processConfig.hostURL = this._makeHostName(host as string, port as unknown as string);
        }

        processConfig.assignment = assignment;

        return processConfig;
    }

    private _makeHostName(host: string, port: string, nameSpace?: string) {
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

    private _getMessages(type: string) {
        if (type === 'cluster_master') return clusterMasterMessages;
        if (type === 'node_master') return nodeMasterMessages;
        if (type === 'assets_service') return assetServiceMessages;
        return new Error(`could not find message model for type: ${type}`);
    }

    getHostUrl() {
        if (this.hostURL) {
            return this.hostURL;
        }

        return null;
    }

    getClientCounts() {
        if (this.io) {
            return this.io.eio.clientsCount;
        }
        // there are no connected clients because the network is not instantiated
        return 0;
    }

    listRooms(): string[] {
        const connected: Record<string, any> = get(this.io, 'sockets.connected', {});

        if (isEmpty(connected)) return [];

        return Object.values(connected).flatMap(
            (meta: Record<string, any>) => Object.keys(meta.rooms)
        );
    }

    registerChildOnlineHook(fn: () => void) {
        this.childHookFn = fn;
    }

    private _isExecutionStateQuery(msg: any) {
        const stateQuery = {
            'cluster:execution:pause': 'cluster:execution:pause',
            'cluster:execution:resume': 'cluster:execution:resume',
            'cluster:slicer:analytics': 'cluster:slicer:analytics',
        };

        return (isKey(stateQuery, msg) && stateQuery[msg] !== undefined);
    }

    private _emitIpcMessage(fn: any) {
        return (ipcMessage: any) => {
            const msg = ipcMessage.message;
            const realMsg = get(this.selfMessages, `ipc.${msg}`, null);
            if (realMsg) {
                fn(realMsg, ipcMessage);
            } else {
                this.logger.error(`process: ${self} has received a message: ${msg}, which is not registered in the messaging module`);
            }
        };
    }

    private _handleIpcMessages() {
        if (this.self === 'execution_controller') {
            const checkAndEmit = (realMsg: any, ipcMessage: any) => {
                if (this.messsagingOnline || !this._isExecutionStateQuery(realMsg)) {
                    this.processContext.emit(realMsg, ipcMessage);
                } else {
                    this.messagingQueue.enqueue([realMsg, ipcMessage]);
                }
            };
            return this._emitIpcMessage(checkAndEmit);
        }
        // for everything else just emit the message
        const emitFn = (realMsg: any, ipcMessage: any) => this.processContext.emit(
            realMsg,
            ipcMessage
        );
        return this._emitIpcMessage(emitFn);
    }

    private _handleWorkerMessage(ipcMessage: any) {
        if (ipcMessage.to === 'cluster_master') {
            this.logger.trace('network passing process message', ipcMessage.message, ipcMessage);
            this.send(ipcMessage);
        } else if (ipcMessage.to === 'node_master') {
            this.logger.trace('process message', ipcMessage.message, ipcMessage);
            this.processContext.emit(ipcMessage.message, ipcMessage);
        } else {
            this._sendToProcesses(ipcMessage);
        }
    }

    async shutdown() {
        if (this.io && isFunction(this.io.close)) {
            this.io.close();
            await pDelay(100);
        }
    }
}
