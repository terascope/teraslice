'use strict';

import debugFn from 'debug';
import { isString, isNumber, clone, get } from 'lodash';
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

const isTesting = process.env.NODE_ENV === 'test';

export class Server extends Core {
    isShuttingDown: boolean;
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

        if (!isNumber(port)) {
            throw new Error('Messenger.Server requires a valid port');
        }

        if (!isString(serverName)) {
            throw new Error('Messenger.Server requires a valid serverName');
        }

        if (!isNumber(clientDisconnectTimeout)) {
            throw new Error('Messenger.Server requires a valid clientDisconnectTimeout');
        }

        this.port = port;
        this.serverName = serverName;
        this.clientDisconnectTimeout = clientDisconnectTimeout;

        // @ts-ignore
        this.server = new SocketIOServer({
            pingTimeout,
            pingInterval,
            perMessageDeflate: false,
            serveClient: false,
        });

        this.httpServer = http.createServer(requestListener);

        if (serverTimeout) {
            this.httpServer.timeout = serverTimeout;
        }

        this.isShuttingDown = false;

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
            socket.join(socket.handshake.query.clientId, next);
        });

        this.server.on('connection', this._onConnection);

        this.onClientReconnect((clientId) => {
            this.emit('ready', { scope: clientId, payload: {} });
        });

        this.onClientOnline((clientId) => {
            this.emit('ready', { scope: clientId, payload: {} });
        });

        this._cleanupClients = setInterval(() => {
            Object.values(this._clients).forEach((client: i.ConnectedClient) => {
                if (client.state === i.ClientState.Shutdown) {
                    this.updateClientState(client.clientId, {
                        state: i.ClientState.Offline,
                    });
                }
                if (client.state === i.ClientState.Disconnected && client.offlineAt) {
                    if (client.offlineAt > Date.now()) {
                        this.updateClientState(client.clientId, {
                            state: i.ClientState.Offline,
                        });
                    }
                }
            });
        }, isTesting ? 100 : 5000);
    }

    async shutdown() {
        this.isShuttingDown = true;

        if (this._cleanupClients != null) {
            clearInterval(this._cleanupClients);
            this._cleanupClients = undefined;
        }

        if (this.closed) {
            this._clients = {};
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

        super.close();
    }

    get connectedClients(): i.ConnectedClient[] {
        return clone(this.filterClientsByState(connectedStates));
    }

    get connectedClientCount(): number {
        return this.countClientsByState(connectedStates);
    }

    get onlineClients(): i.ConnectedClient[] {
        return clone(this.filterClientsByState(onlineStates));
    }

    get onlineClientCount(): number {
        return this.countClientsByState(onlineStates);
    }

    get disconnectedClients(): i.ConnectedClient[] {
        return clone(this.filterClientsByState(disconnectedStates));
    }

    get disconectedClientCount(): number {
        return this.countClientsByState(disconnectedStates);
    }

    get offlineClients(): i.ConnectedClient[] {
        return clone(this.filterClientsByState([i.ClientState.Offline]));
    }

    get offlineClientCount(): number {
        return this.countClientsByState([i.ClientState.Offline]);
    }

    get availableClients(): i.ConnectedClient[] {
        return clone(this.filterClientsByState([i.ClientState.Available]));
    }

    get availableClientCount(): number {
        return this.countClientsByState([i.ClientState.Available]);
    }

    get unavailableClients(): i.ConnectedClient[] {
        return clone(this.filterClientsByState(unavailableStates));
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
        const clientState = get(this._clients, [clientId, 'state']);
        return onlineStates.includes(clientState);
    }

    protected sendToAll(eventName: string, payload?: i.Payload, options: i.SendOptions = { volatile: true, response: true }) {
        const clients = this.filterClientsByState(onlineStates);
        const promises = Object.values(clients).map((client) => {
            return this.send(client.clientId, eventName, payload, options);
        });
        return Promise.all(promises);
    }

    protected async send(clientId: string, eventName: string, payload: i.Payload = {}, options: i.SendOptions = { response: true }): Promise<i.Message|null> {
        if (!this.isClientConnected(clientId)) {
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

        this.server.to(clientId).emit(message.eventName, message);

        return responseMsg;
    }

    isClientConnected(clientId: string): boolean {
        if (this._clients[clientId] == null) return false;
        const { state } = this._clients[clientId];
        return connectedStates.includes(state);
    }

    protected getClientMetadataFromSocket(socket: SocketIO.Socket): i.ClientSocketMetadata {
        return socket.handshake.query;
    }

    private filterClientsByState(states: i.ClientState[]): i.ConnectedClient[] {
        return Object.values(this._clients).filter((client) => {
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

        const updatedAt = Date.now();
        this._clients[clientId].state = update.state;
        this._clients[clientId].updatedAt = updatedAt;

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

                this._clients[clientId].offlineAt = Date.now() + this.clientDisconnectTimeout;

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
            });
            return client;
        }

        const newClient: i.ConnectedClient = {
            clientId,
            clientType,
            state: i.ClientState.Online,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            offlineAt: null
        };

        this.emit(`client:${i.ClientState.Online}`, { scope: clientId, payload: {} });

        this._clients[clientId] = newClient;
        return newClient;
    }

    private _onConnection(socket: SocketIO.Socket) {
        const client = this.ensureClient(socket);
        const { clientId } = client;

        socket.on('error', (error: Error|string) => {
            this.emit('client:error', {
                scope: clientId,
                payload: {},
                error
            });
        });

        socket.on('disconnect', (error: Error|string) => {
            socket.removeAllListeners();
            socket.disconnect(true);

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
