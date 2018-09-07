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
            transports: ['websocket'],
            allowUpgrades: false,
            serveClient: false,
        });

        this.httpServer = http.createServer(requestListener);

        if (serverTimeout) {
            this.httpServer.timeout = serverTimeout;
        }

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
            this.emit('ready', clientId);
        });

        this.onClientOnline((clientId) => {
            this.emit('ready', clientId);
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

    getClient(clientId: string): i.ConnectedClient|undefined {
        return _.cloneDeep(this._clients[clientId]);
    }

    async shutdown() {
        if (this._cleanupClients != null) {
            clearInterval(this._cleanupClients);
        }

        this._clients = {};
        this._clientSendFns = {};

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
        const clients = this.filterClientsByState(connectedStates);
        return _.cloneDeep(clients);
    }

    get connectedClientCount(): number {
        const clients = this.filterClientsByState(connectedStates);
        return _.size(clients);
    }

    get onlineClients(): i.ConnectedClient[] {
        const clients = this.filterClientsByState(onlineStates);
        return _.cloneDeep(clients);
    }

    get onlineClientCount(): number {
        const clients = this.filterClientsByState(onlineStates);
        return _.size(clients);
    }

    get disconnectedClients(): i.ConnectedClient[] {
        const clients = this.filterClientsByState(disconnectedStates);
        return _.cloneDeep(clients);
    }

    get disconectedClientCount(): number {
        const clients = this.filterClientsByState(disconnectedStates);
        return _.size(clients);
    }

    get offlineClients(): i.ConnectedClient[] {
        const clients = this.filterClientsByState([i.ClientState.Offline]);
        return _.cloneDeep(clients);
    }

    get offlineClientCount(): number {
        const clients = this.filterClientsByState([i.ClientState.Offline]);
        return _.size(clients);
    }

    get availableClients(): i.ConnectedClient[] {
        const clients = this.filterClientsByState([i.ClientState.Available]);
        return _.cloneDeep(clients);
    }

    get availableClientCount(): number {
        const clients = this.filterClientsByState([i.ClientState.Available]);
        return _.size(clients);
    }

    get unavailableClients(): i.ConnectedClient[] {
        const clients = this.filterClientsByState(unavailableStates);
        return _.cloneDeep(clients);
    }

    get unavailableClientCount(): number {
        const clients = this.filterClientsByState(unavailableStates);
        return _.size(clients);
    }

    onClientOnline(fn: i.ClientEventFn) {
        this.on(`client:${i.ClientState.Online}`, fn);
    }

    onClientAvailable(fn: i.ClientEventFn) {
        this.on(`client:${i.ClientState.Available}`, fn);
    }

    onClientUnavailable(fn: i.ClientEventFn) {
        this.on(`client:${i.ClientState.Unavailable}`, fn);
    }

    onClientOffline(fn: i.ClientEventFn) {
        this.on(`client:${i.ClientState.Offline}`, fn);
    }

    onClientDisconnect(fn: i.ClientEventFn) {
        this.on(`client:${i.ClientState.Disconnected}`, fn);
    }

    onClientShutdown(fn: i.ClientEventFn) {
        this.on(`client:${i.ClientState.Shutdown}`, fn);
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

    isClientReady(clientId: string) {
        const clientState = _.get(this._clients, [clientId, 'state']);
        return onlineStates.includes(clientState);
    }

    protected broadcast(eventName: string, payload: i.Payload) {
        const message: i.Message = {
            id: newMsgId(),
            respondBy: Date.now() + this.getTimeout(),
            eventName,
            payload,
            to: '*',
            from: this.serverName,
        };

        this.server.sockets.emit(eventName, message);
    }

    protected sendToAll(eventName: string, payload?: i.Payload) {
        const clients = this.filterClientsByState(onlineStates);
        const promises = _.map(clients, (client) => {
            return this.send(client.clientId, eventName, payload, true);
        });
        return Promise.all(promises);
    }

    protected sendToGroup(eventName: string, query: object, payload?: i.Payload, volatile?: boolean) {
        const clients = _.filter(this._clients, query);
        const promises = _.map(clients, (client) => {
            return this.send(client.clientId, eventName, payload, volatile);
        });
        return Promise.all(promises);
    }

    protected async send(clientId: string, eventName: string, payload: i.Payload = {}, volatile?: boolean): Promise<i.Message|null> {
        if (!_.has(this._clientSendFns, clientId)) {
            throw new Error(`No client found by that id "${clientId}"`);
        }

        return this._clientSendFns[clientId](eventName, payload, volatile);
    }

    protected getClientMetadataFromSocket(socket: SocketIO.Socket): i.ClientSocketMetadata {
        return socket.handshake.query;
    }

    private filterClientsByState(states: i.ClientState[]): i.ConnectedClient[] {
        return _.filter(this._clients, (client) => {
            return states.includes(client.state);
        });
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

        const updatedAt = new Date();
        const debugObj = _.pickBy({
            payload: update.payload,
            error: update.payload,
            socketId: update.socketId,
            metadata: update.metadata,
            updatedAt,
        });

        debug(`${clientId} is being updated from ${currentState} to ${update.state}`, debugObj);

        this._clients[clientId].state = update.state;
        this._clients[clientId].updatedAt = updatedAt;

        if (update.socketId) {
            this._clients[clientId].socketId = update.socketId;
        }

        if (update.metadata) {
            Object.assign(this._clients[clientId].metadata, update.metadata);
        }

        switch (update.state) {
            case i.ClientState.Online:
                this.emit('client:reconnect', clientId);
                return true;

            case i.ClientState.Available:
                this.emit(`client:${update.state}`, clientId, update.payload);
                return true;

            case i.ClientState.Unavailable:
                this.emit(`client:${update.state}`, clientId, update.payload);
                return true;

            case i.ClientState.Shutdown:
                this.emit(`client:${update.state}`, clientId, update.payload);
                return true;

            case i.ClientState.Disconnected:
                if (currentState === i.ClientState.Available) {
                    debug(`${clientId} is unavailable because it was marked as disconnected`);
                    this.emit(`client:${i.ClientState.Unavailable}`, clientId);
                }

                if (currentState !== i.ClientState.Shutdown) {
                    const offlineAtMs = Date.now() + this.clientDisconnectTimeout;
                    this._clients[clientId].offlineAt = new Date(offlineAtMs);

                    debug(`${clientId} is disconnected will be considered offline in ${this.clientDisconnectTimeout}`);
                } else {
                    debug(`${clientId} has been marked to shutdown no need to wait for disconnect`);
                    this._clients[clientId].offlineAt = new Date();
                }

                this.emit(`client:${update.state}`, clientId, update.error);
                return true;

            case i.ClientState.Offline:
                if (!disconnectedStates.includes(currentState)) {
                    if (currentState === i.ClientState.Available) {
                        debug(`${clientId} is unavailable because it was marked as offline`);
                        this.emit(`client:${i.ClientState.Unavailable}`, clientId);
                    }

                    debug(`${clientId} is disconnected because it was marked as offline`);
                    this.emit(`client:${i.ClientState.Disconnected}`, clientId);
                }

                this.emit(`client:${update.state}`, clientId, update.error);
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
            socketId: socket.id,
            metadata: {},
        };

        this.emit(`client:${i.ClientState.Online}`, clientId);

        this._clients[clientId] = newClient;
        return newClient;
    }

    private _onConnection(socket: SocketIO.Socket) {
        const client = this.ensureClient(socket);
        const { clientId } = client;

        this._clientSendFns[clientId] = async (eventName, payload = {}, volatile = false) => {
            await this.waitForClientReady(clientId);

            const message: i.Message = {
                id: newMsgId(),
                respondBy: Date.now() + this.getTimeout(),
                eventName,
                payload,
                to: clientId,
                from: this.serverName,
                volatile
            };

            const response = await new Promise((resolve, reject) => {
                socket.emit(eventName, message, this.handleSendResponse(message, resolve, reject));
            });

            if (!response) return null;
            return response as i.Message;
        };

        socket.on('error', (err: Error|string) => {
            this.emit('client:error', clientId, err);
        });

        socket.on('disconnect', (error: Error|string) => {
            this.updateClientState(clientId, {
                state: i.ClientState.Disconnected,
                error,
            });
        });

        socket.on(`client:${i.ClientState.Available}`, this.handleResponse(`client:${i.ClientState.Available}`, (msg: i.Message) => {
            this.updateClientState(clientId, {
                state: i.ClientState.Available,
                payload: msg.payload,
            });
        }));

        socket.on(`client:${i.ClientState.Unavailable}`, this.handleResponse(`client:${i.ClientState.Unavailable}`, (msg: i.Message) => {
            this.updateClientState(clientId, {
                state: i.ClientState.Unavailable,
                payload: msg.payload,
            });
        }));

        socket.on(`client:${i.ClientState.Shutdown}`, this.handleResponse(`client:${i.ClientState.Shutdown}`, (msg: i.Message) => {
            this.updateClientState(clientId, {
                state: i.ClientState.Shutdown,
                payload: msg.payload,
            });
        }));

        this.emit('connection', clientId, socket);
    }
}

// @ts-ignore
function defaultRequestListener(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(501);
    res.end('Not Implemented');
}
