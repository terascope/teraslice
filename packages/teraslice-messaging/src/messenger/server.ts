'use strict';

import _ from 'lodash';
import SocketIOServer from 'socket.io';
import http from 'http';
import porty from 'porty';
import { newMsgId } from '../utils';
import * as i from './interfaces';
import { Core } from './core';

export class Server extends Core {
    readonly port: number;
    readonly server: SocketIO.Server;
    readonly httpServer: http.Server;
    readonly serverName: string;
    readonly clientDisconnectTimeout: number;
    private _cleanupClients: NodeJS.Timer|undefined;
    protected _clients: i.ConnectedClients;

    constructor(opts: i.ServerOptions) {
        const {
            port,
            pingTimeout,
            pingInterval,
            serverName,
            serverTimeout,
            clientDisconnectTimeout,
            requestListener = defaultRequestListener
        } = opts;
        super(opts);

        if (!_.isNumber(port)) {
            throw new Error('Messenger.Server requires a valid port');
        }

        if (!_.isString(serverName)) {
            throw new Error('Messenger.Server requires a valid serverName');
        }

        if (!_.isNumber(clientDisconnectTimeout)) {
            throw new Error('Messenger.Server requires a valid clientDisconnectTimeout');
        }

        this.port = port;
        this.serverName = serverName;
        this.clientDisconnectTimeout = clientDisconnectTimeout;

        this.server = SocketIOServer({
            pingTimeout,
            pingInterval,
            transports: ['websocket'],
            allowUpgrades: false,
            serveClient: false,
        });

        this.httpServer = http.createServer(requestListener);

        if (serverTimeout) {
            this.httpServer.timeout = serverTimeout;
        }

        this._clients = {};
        this._onConnection = this._onConnection.bind(this);
    }

    async listen() {
        const portAvailable = await porty.test(this.port);
        if (!portAvailable) {
            throw new Error(`Port ${this.port} is already in-use`);
        }

        await new Promise((resolve, reject) => {
            this.httpServer.listen(this.port, (err?: Error) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        this.server.attach(this.httpServer);

        this.server.use((socket, next) => {
            socket.join(socket.handshake.query.clientType, next);
        });

        this.server.on('connection', this._onConnection);

        this._cleanupClients = setInterval(() => {
            this._clients = _.omitBy(this._clients, (client: i.ConnectedClient) => {
                if (!client.isOnline && client.offlineAt) {
                    if (client.offlineAt.getTime() > Date.now()) {
                        this.emit('client:offline', client.clientId);
                        return false;
                    }
                }
                return true;
            });
        }, 1000);
    }

    getClient(clientId: string): i.ConnectedClient|undefined {
        return _.cloneDeep(this._clients[clientId]);
    }

    async shutdown() {
        if (this._cleanupClients != null) {
            clearInterval(this._cleanupClients);
        }

        await new Promise((resolve) => {
            this.server.close(() => {
                resolve();
            });
        });

        await new Promise((resolve) => {
            this.httpServer.close(() => {
                resolve();
            });
        });

        super.close();
    }

    get connectedClients(): i.ConnectedClient[] {
        return _.cloneDeep(_.values(this._clients));
    }

    get connectedClientCount(): number {
        return _.size(this._clients);
    }

    get onlineClients(): i.ConnectedClient[] {
        return _.cloneDeep(_.filter(this._clients, { isOnline: true }));
    }

    get onlineClientCount(): number {
        return _.size(_.filter(this._clients, { isOnline: true }));
    }

    get offlineClients(): i.ConnectedClient[] {
        return _.cloneDeep(_.filter(this._clients, { isOnline: false }));
    }

    get offlineClientCount(): number {
        return _.size(_.filter(this._clients, { isOnline: false }));
    }

    get availableClients(): i.ConnectedClient[] {
        return _.cloneDeep(_.filter(this._clients, { isAvailable: true, isOnline: true }));
    }

    get availableClientCount(): number {
        return _.size(_.filter(this._clients, { isAvailable: true, isOnline: true }));
    }

    get unavailableClients(): i.ConnectedClient[] {
        return _.cloneDeep(_.filter(this._clients, { isAvailable: false }));
    }

    get unavailableClientCount(): number {
        return _.size(_.filter(this._clients, { isAvailable: false }));
    }

    onClientOnline(fn: i.ClientEventFn) {
        this.on('client:online', fn);
    }

    onClientAvailable(fn: i.ClientEventFn) {
        this.on('client:available', fn);
    }

    onClientUnavailable(fn: i.ClientEventFn) {
        this.on('client:unavailable', fn);
    }

    onClientOffline(fn: i.ClientEventFn) {
        this.on('client:offline', fn);
    }

    onClientDisconnect(fn: i.ClientEventFn) {
        this.on('client:disconnect', fn);
    }

    onClientReconnect(fn: i.ClientEventFn) {
        this.on('client:reconnect', fn);
    }

    onClientError(fn: i.ClientEventFn) {
        this.on('client:error', fn);
    }

    emit(eventName: string, clientId: string, param?: any) {
        return super.emit(eventName, clientId, param);
    }

    on(eventName: string, fn: i.ClientEventFn) {
        return super.on(eventName, fn);
    }

    async onceWithTimeout(eventName: string, timeout?: number): Promise<any>;
    async onceWithTimeout(eventName: string, forClientId: string, timeout?: number): Promise<any>;
    async onceWithTimeout(eventName: string, ...params: any[]): Promise<any> {
        let timeoutMs: number = this.getTimeout();
        let forClientId: string|undefined;

        if (_.isNumber(params[0])) {
            timeoutMs = this.getTimeout(params[0]);
        } else if (_.isString(params[0])) {
            forClientId = params[0];
            if (_.isNumber(params[1])) {
                timeoutMs = this.getTimeout(params[1]);
            }
        }

        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.removeListener(eventName, _onceWithTimeout);
                resolve();
            }, timeoutMs);

            function _onceWithTimeout(clientId: string, param?: any) {
                if (forClientId && forClientId !== clientId) return;
                clearTimeout(timer);
                if (!param) {
                    resolve(clientId);
                } else {
                    resolve(param);
                }
            }

            this.on(eventName, _onceWithTimeout);
        });
    }

    protected broadcast(eventName: string, payload: i.Payload) {
        const message: i.Message = {
            id: newMsgId(),
            eventName,
            payload,
            to: '*',
            from: this.serverName,
        };

        this.server.sockets.emit(eventName, message);
    }

    protected sendToGroup(eventName: string, query: object, payload?: i.Payload) {
        const clients = _.filter(this._clients, query);
        const promises = _.map(clients, (client) => {
            return this.send(client.clientId, eventName, payload);
        });
        return Promise.all(promises);
    }

    protected async send(clientId: string, eventName: string, payload: i.Payload = {}, volatile?: boolean): Promise<i.Message|null> {
        const client = this._clients[clientId];
        if (!client) {
            if (volatile) return null;
            throw new Error(`No client found by that id "${clientId}"`);
        }

        if (!client.isOnline && client.offlineAt) {
            if (volatile) return null;
            const timeleft = client.offlineAt.getTime() - Date.now();
            const result = await this.onceWithTimeout('client:reconnect', clientId, timeleft);
            if (!result) return null;
        }

        const message: i.Message = {
            id: newMsgId(),
            eventName,
            payload,
            to: clientId,
            from: this.serverName,
            volatile
        };

        const response = await new Promise((resolve, reject) => {
            const socket = this.getClientSocket(clientId);
            if (!socket) {
                reject(new Error(`Unable to find socket for client ${clientId}`));
                return;
            }
            socket.emit(eventName, message, this.handleSendResponse(resolve, reject));
        });

        if (!response) return null;
        return response as i.Message;
    }

    protected getClientSocket(clientId: string): SocketIO.Socket {
        const socketId = _.get(this._clients, [clientId, 'socketId']);
        return _.get(this.server, ['sockets', 'connected', socketId]);
    }

    protected getClientMetadataFromSocket(socket: SocketIO.Socket): i.ClientSocketMetadata {
        return socket.handshake.query;
    }

    protected updateClient(clientId: string, updateWith: object) {
        const pairs = _.toPairs(updateWith);
        _.forEach(pairs, ([key, value]) => {
            _.set(this._clients, [clientId, key], value);
        });
    }

    protected ensureClient(socket: SocketIO.Socket) : i.ConnectedClient {
        const { clientId, clientType } = this.getClientMetadataFromSocket(socket);
        const client = this._clients[clientId];

        if (client) {
            this.updateClient(clientId, {
                isReconnected: true,
                isNewConnection: client.socketId !== socket.id,
                isOnline: true,
                onlineAt: new Date(),
                offlineAt: null,
                socketId: socket.id,
            });
            return client;
        }

        const newClient: i.ConnectedClient = {
            clientId,
            clientType,
            isOnline: true,
            isAvailable: false,
            isReconnected: false,
            onlineAt: new Date(),
            offlineAt: null,
            unavailableAt: null,
            availableAt: null,
            isNewConnection: true,
            socketId: socket.id,
            metadata: {},
        };

        this._clients[clientId] = newClient;
        return newClient;
    }

    private _onConnection(socket: SocketIO.Socket) {
        const client = this.ensureClient(socket);
        const { clientId, isReconnected, isNewConnection } = client;

        if (isReconnected) {
            this.emit('client:reconnect', clientId);
        } else {
            this.emit('client:online', clientId);
        }

        socket.on('error', (err: Error) => {
            this.emit('client:error', clientId, err);
        });

        socket.on('disconnect', (err: Error) => {
            this.emit('client:disconnect', clientId, err);
            const offlineAt = Date.now() + this.clientDisconnectTimeout;
            this.updateClient(clientId, {
                isOnline: true,
                isAvailable: false,
                onlineAt: null,
                offlineAt,
            });
        });

        socket.on('client:available', this.handleResponse((msg: i.Message) => {
            this.updateClient(clientId, {
                isAvailable: true,
                availableAt: new Date(),
                unavailableAt: null,
            });
            this.emit('client:available', clientId, msg.payload);
        }));

        socket.on('client:unavailable', this.handleResponse((msg: i.Message) => {
            this.updateClient(clientId, {
                isAvailable: false,
                availableAt: null,
                unavailableAt: new Date(),
            });
            this.emit('client:unavailable', clientId, msg.payload);
        }));

        if (isNewConnection) {
            this.emit('connection', clientId, socket);
        }
    }
}

// @ts-ignore
function defaultRequestListener(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(501);
    res.end('Not Implemented');
}
