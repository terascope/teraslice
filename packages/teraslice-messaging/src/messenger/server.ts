'use strict';

import debugFn from 'debug';
import _ from 'lodash';
import SocketIOServer from 'socket.io';
import http from 'http';
import porty from 'porty';
import { newMsgId } from '../utils';
import * as i from './interfaces';
import { Core } from './core';

const debug = debugFn('teraslice-messaging:server');

const disconnectedStates = [
    i.ClientState.Offline,
    i.ClientState.Disconnected,
    i.ClientState.Shutdown,
];

const unavailableStates = [
    i.ClientState.Unavailable,
    ...disconnectedStates
];

const onlineStates = [
    i.ClientState.Online,
    i.ClientState.Available,
    i.ClientState.Unavailable
];

const connectedStates = [
    i.ClientState.Disconnected,
    ...onlineStates
];

export class Server extends Core {
    isShuttingDown: boolean;
    readonly port: number;
    readonly server: SocketIO.Server;
    readonly httpServer: http.Server;
    readonly serverName: string;
    readonly clientDisconnectTimeout: number;
    private _cleanupClients: NodeJS.Timer|undefined;
    protected _clients: i.ConnectedClients;
    protected _clientSendFns: i.ClientSendFns;

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
            // transports: ['websocket'],
            // allowUpgrades: false,
            serveClient: false,
        });

        this.httpServer = http.createServer(requestListener);

        if (serverTimeout) {
            this.httpServer.timeout = serverTimeout;
        }

        this.isShuttingDown = false;

        this._clients = {};
        this._clientSendFns = {};
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

        this.onClientReconnect((clientId) => {
            this.emit('ready', { scope: clientId, payload: {} });
        });

        this.onClientOnline((clientId) => {
            this.emit('ready', { scope: clientId, payload: {} });
        });

        this._cleanupClients = setInterval(() => {
            _.forEach(this._clients, (client: i.ConnectedClient) => {
                if (client.state === i.ClientState.Shutdown) {
                    this.updateClientState(client.clientId, {
                        state: i.ClientState.Offline,
                    });
                }
                if (client.state === i.ClientState.Disconnected && client.offlineAt) {
                    if (client.offlineAt.getTime() > Date.now()) {
                        this.updateClientState(client.clientId, {
                            state: i.ClientState.Offline,
                        });
                    }
                }
            });
        }, 1000);
    }

    async shutdown() {
        this.isShuttingDown = true;

        if (this._cleanupClients != null) {
            clearInterval(this._cleanupClients);
        }

        if (this.closed) {
            this._clients = {};
            this._clientSendFns = {};
            return;
        }

        await new Promise((resolve) => {
            this.server.volatile.emit('shutdown');

            this.server.close(() => {
                resolve();
            });
        });

        await new Promise((resolve) => {
            this.httpServer.close(() => {
                resolve();
            });
        });

        this._clients = {};
        this._clientSendFns = {};

        super.close();
    }

    get connectedClients(): i.ConnectedClient[] {
        return _.clone(this.filterClientsByState(connectedStates));
    }

    get connectedClientCount(): number {
        return this.countClientsByState(connectedStates);
    }

    get onlineClients(): i.ConnectedClient[] {
        return _.clone(this.filterClientsByState(onlineStates));
    }

    get onlineClientCount(): number {
        return this.countClientsByState(onlineStates);
    }

    get disconnectedClients(): i.ConnectedClient[] {
        return _.clone(this.filterClientsByState(disconnectedStates));
    }

    get disconectedClientCount(): number {
        return this.countClientsByState(disconnectedStates);
    }

    get offlineClients(): i.ConnectedClient[] {
        return _.clone(this.filterClientsByState([i.ClientState.Offline]));
    }

    get offlineClientCount(): number {
        return this.countClientsByState([i.ClientState.Offline]);
    }

    get availableClients(): i.ConnectedClient[] {
        return _.clone(this.filterClientsByState([i.ClientState.Available]));
    }

    get availableClientCount(): number {
        return this.countClientsByState([i.ClientState.Available]);
    }

    get unavailableClients(): i.ConnectedClient[] {
        return _.clone(this.filterClientsByState(unavailableStates));
    }

    get unavailableClientCount(): number {
        return this.countClientsByState(unavailableStates);
    }

    onClientOnline(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Online}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientAvailable(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Available}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientUnavailable(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Unavailable}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientOffline(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Offline}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientDisconnect(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Disconnected}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientShutdown(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Shutdown}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientReconnect(fn: (clientId: string) => void) {
        return this.on('client:reconnect', (msg) => {
            fn(msg.scope);
        });
    }

    onClientError(fn: (clientId: string) => void) {
        return this.on('client:error', (msg) => {
            fn(msg.scope);
        });
    }

    isClientReady(clientId: string) {
        const clientState = _.get(this._clients, [clientId, 'state']);
        return onlineStates.includes(clientState);
    }

    protected sendToAll(eventName: string, payload?: i.Payload, options: i.SendOptions = { volatile: true, response: true }) {
        const clients = this.filterClientsByState(onlineStates);
        const promises = _.map(clients, (client) => {
            return this.send(client.clientId, eventName, payload, options);
        });
        return Promise.all(promises);
    }

    protected async send(clientId: string, eventName: string, payload: i.Payload = {}, options: i.SendOptions = { response: true }): Promise<i.Message|null> {
        if (!_.has(this._clientSendFns, clientId)) {
            throw new Error(`No client found by that id "${clientId}"`);
        }

        if (this.closed) return null;

        if (this.isShuttingDown) {
            options.volatile = true;
        }

        if (!options.volatile && !this.isClientReady(clientId)) {
            await this.waitForClientReady(clientId);
        }

        const response = options.response != null ? options.response : true;
        const respondBy = Date.now() + this.getTimeout(options.timeout);

        const message: i.Message = {
            id: newMsgId(),
            eventName,
            from: this.serverName,
            to: clientId,
            payload,
            volatile: options.volatile,
            response,
            respondBy,
        };

        const responseMsg = this.handleSendResponse(message);
        this._clientSendFns[clientId](message);
        return responseMsg;
    }

    protected getClientMetadataFromSocket(socket: SocketIO.Socket): i.ClientSocketMetadata {
        return socket.handshake.query;
    }

    private filterClientsByState(states: i.ClientState[]): i.ConnectedClient[] {
        return _.filter(this._clients, (client) => {
            return states.includes(client.state);
        });
    }

    private countClientsByState(states: i.ClientState[]): number {
        let count = 0;
        for (const client of Object.values(this._clients)) {
            if (states.includes(client.state)) {
                count += 1;
            }
        }
        return count;
    }

    protected updateClientState(clientId: string, update: i.UpdateClientState): boolean {
        const client = this._clients[clientId];
        if (!client) {
            debug(`${clientId} does not exist and cannot be updated`);
            return false;
        }

        const currentState = client.state;
        if (currentState === update.state) {
            debug(`${clientId} state of ${currentState} is the same, skipping update`);
            return false;
        }

        if (currentState === i.ClientState.Shutdown && update.state !== i.ClientState.Offline) {
            debug(`${clientId} state of ${currentState} can only be updated to offline`);
            return false;
        }

        const updatedAt = new Date();
        this._clients[clientId].state = update.state;
        this._clients[clientId].updatedAt = updatedAt;

        if (update.socketId) {
            this._clients[clientId].socketId = update.socketId;
        }

        const eventMsg = {
            scope: clientId,
            payload: update.payload,
            error: update.error,
        };

        switch (update.state) {
            case i.ClientState.Online:
                this.emit('client:reconnect', eventMsg);
                return true;

            case i.ClientState.Available:
                this.emit(`client:${update.state}`, eventMsg);
                return true;

            case i.ClientState.Unavailable:
                this.emit(`client:${update.state}`, eventMsg);
                return true;

            case i.ClientState.Shutdown:
                this.emit(`client:${update.state}`, eventMsg);
                return true;

            case i.ClientState.Disconnected:
                if (currentState === i.ClientState.Available) {
                    debug(`${clientId} is unavailable because it was marked as disconnected`);
                    this.emit(`client:${i.ClientState.Unavailable}`, eventMsg);
                }

                const offlineAtMs = Date.now() + this.clientDisconnectTimeout;
                this._clients[clientId].offlineAt = new Date(offlineAtMs);

                debug(`${clientId} is disconnected will be considered offline in ${this.clientDisconnectTimeout}`);
                this.emit(`client:${update.state}`, eventMsg);
                return true;

            case i.ClientState.Offline:
                if (!disconnectedStates.includes(currentState)) {
                    if (currentState === i.ClientState.Available) {
                        debug(`${clientId} is unavailable because it was marked as offline`);
                        this.emit(`client:${i.ClientState.Unavailable}`, eventMsg);
                    }

                    debug(`${clientId} is disconnected because it was marked as offline`);
                    this.emit(`client:${i.ClientState.Disconnected}`, eventMsg);
                }

                this.emit(`client:${update.state}`, eventMsg);

                // cleanup socket and such
                const { socketId } = this._clients[clientId];

                if (this.server.sockets.sockets[socketId]) {
                    try {
                        this.server.sockets.sockets[socketId].removeAllListeners();
                        this.server.sockets.sockets[socketId].disconnect(true);
                    } catch (err) {
                        debug('error cleaning up socket when going offline', err);
                    }
                    delete this.server.sockets.sockets[socketId];
                }

                delete this._clientSendFns[clientId];
                return true;

            default:
                return false;
        }
    }

    protected ensureClient(socket: SocketIO.Socket) : i.ConnectedClient {
        const { clientId, clientType } = this.getClientMetadataFromSocket(socket);
        const client = this._clients[clientId];

        if (client) {
            this.updateClientState(clientId, {
                state: i.ClientState.Online,
                socketId: socket.id,
            });
            return client;
        }

        const newClient: i.ConnectedClient = {
            clientId,
            clientType,
            state: i.ClientState.Online,
            createdAt: new Date(),
            updatedAt: new Date(),
            offlineAt: null,
            socketId: socket.id
        };

        this.emit(`client:${i.ClientState.Online}`, { scope: clientId, payload: {} });

        this._clients[clientId] = newClient;
        return newClient;
    }

    private _onConnection(socket: SocketIO.Socket) {
        const client = this.ensureClient(socket);
        const { clientId } = client;

        this._clientSendFns[clientId] = (message: i.Message) => {
            socket.emit(message.eventName, message);
        };

        socket.on('error', (error: Error|string) => {
            this.emit('client:error', {
                scope: clientId,
                payload: {},
                error
            });
        });

        socket.on('disconnect', (error: Error|string) => {
            if (this.isShuttingDown) {
                this.updateClientState(clientId, {
                    state: i.ClientState.Shutdown,
                    error,
                });
            } else {
                this.updateClientState(clientId, {
                    state: i.ClientState.Disconnected,
                    error,
                });
            }
        });

        this.handleResponse(socket, `client:${i.ClientState.Available}`, (msg: i.Message) => {
            this.updateClientState(clientId, {
                state: i.ClientState.Available,
                payload: msg.payload,
            });
        });

        this.handleResponse(socket, `client:${i.ClientState.Unavailable}`, (msg: i.Message) => {
            this.updateClientState(clientId, {
                state: i.ClientState.Unavailable,
                payload: msg.payload,
            });
        });

        this.handleResponse(socket, `client:${i.ClientState.Shutdown}`, (msg: i.Message) => {
            this.updateClientState(clientId, {
                state: i.ClientState.Shutdown,
                payload: msg.payload,
            });
        });

        socket.on('message:response', (msg: i.Message) => {
            this.emit(msg.id, {
                scope: msg.from,
                payload: msg,
            });
        });

        this.emit('connection', {
            scope: clientId,
            payload: socket
        });
    }
}

// @ts-ignore
function defaultRequestListener(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(501);
    res.end('Not Implemented');
}
