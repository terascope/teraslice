'use strict';

import { isTest, isString, isNumber, get, debugLogger } from '@terascope/utils';
import SocketIOServer from 'socket.io';
import http from 'http';
import porty from 'porty';
import { newMsgId } from '../utils';
import * as i from './interfaces';
import { Core } from './core';

const _logger = debugLogger('teraslice-messaging:server');

const disconnectedStates = [i.ClientState.Offline, i.ClientState.Disconnected, i.ClientState.Shutdown];

const unavailableStates = [i.ClientState.Unavailable, ...disconnectedStates];

const onlineStates = [i.ClientState.Online, i.ClientState.Available, i.ClientState.Unavailable];

const connectedStates = [i.ClientState.Disconnected, ...onlineStates];

export class Server extends Core {
    isShuttingDown: boolean;
    readonly port: number;
    readonly server: SocketIO.Server;
    readonly httpServer: http.Server;
    readonly serverName: string;
    readonly clientDisconnectTimeout: number;
    private _cleanupClients: any;
    protected _clients: i.ConnectedClients;

    constructor(opts: i.ServerOptions) {
        const {
            port,
            pingTimeout,
            pingInterval,
            serverName,
            serverTimeout,
            clientDisconnectTimeout,
            requestListener = defaultRequestListener,
            logger = _logger,
            ...coreOpts
        } = opts;

        super({
            logger: logger
                ? logger.child({
                    module: 'messaging:server',
                })
                : _logger,
            ...coreOpts,
        });

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

        this.onClientReconnect(clientId => {
            this.emit('ready', { scope: clientId, payload: {} });
        });

        this.onClientOnline(clientId => {
            this.emit('ready', { scope: clientId, payload: {} });
        });

        this._cleanupClients = setInterval(
            () => {
                for (const { clientId, state, offlineAt } of Object.values(this._clients)) {
                    if (state === i.ClientState.Shutdown) {
                        this.updateClientState(clientId, i.ClientState.Offline);
                    }
                    if (state === i.ClientState.Disconnected && offlineAt) {
                        if (offlineAt > Date.now()) {
                            this.updateClientState(clientId, i.ClientState.Offline);
                        }
                    }
                }
            },
            isTest ? 100 : 5000
        );
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

        await new Promise(resolve => {
            this.server.volatile.emit('shutdown');

            this.server.close(() => {
                resolve();
            });
        });

        await new Promise(resolve => {
            this.httpServer.close(() => {
                resolve();
            });
        });

        this._clients = {};

        super.close();
    }

    get connectedClients(): i.ConnectedClient[] {
        return this.filterClientsByState(connectedStates).slice();
    }

    get connectedClientCount(): number {
        return this.countClientsByState(connectedStates);
    }

    get onlineClients(): i.ConnectedClient[] {
        return this.filterClientsByState(onlineStates).slice();
    }

    get onlineClientCount(): number {
        return this.countClientsByState(onlineStates);
    }

    get disconnectedClients(): i.ConnectedClient[] {
        return this.filterClientsByState(disconnectedStates).slice();
    }

    get disconectedClientCount(): number {
        return this.countClientsByState(disconnectedStates);
    }

    get offlineClients(): i.ConnectedClient[] {
        return this.filterClientsByState([i.ClientState.Offline]).slice();
    }

    get offlineClientCount(): number {
        return this.countClientsByState([i.ClientState.Offline]);
    }

    get availableClients(): i.ConnectedClient[] {
        return this.filterClientsByState([i.ClientState.Available]).slice();
    }

    get availableClientCount(): number {
        return this.countClientsByState([i.ClientState.Available]);
    }

    get unavailableClients(): i.ConnectedClient[] {
        return this.filterClientsByState(unavailableStates).slice();
    }

    get unavailableClientCount(): number {
        return this.countClientsByState(unavailableStates);
    }

    onClientOnline(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Online}`, msg => {
            fn(msg.scope);
        });
    }

    onClientAvailable(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Available}`, msg => {
            fn(msg.scope);
        });
    }

    onClientUnavailable(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Unavailable}`, msg => {
            fn(msg.scope);
        });
    }

    onClientOffline(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Offline}`, msg => {
            fn(msg.scope);
        });
    }

    onClientDisconnect(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Disconnected}`, msg => {
            fn(msg.scope);
        });
    }

    onClientShutdown(fn: (clientId: string) => void) {
        return this.on(`client:${i.ClientState.Shutdown}`, msg => {
            fn(msg.scope);
        });
    }

    onClientReconnect(fn: (clientId: string) => void) {
        return this.on('client:reconnect', msg => {
            fn(msg.scope);
        });
    }

    onClientError(fn: (clientId: string) => void) {
        return this.on('client:error', msg => {
            fn(msg.scope);
        });
    }

    isClientReady(clientId: string) {
        const clientState = get(this._clients, [clientId, 'state']);
        return onlineStates.includes(clientState);
    }

    protected sendToAll(eventName: string, payload?: i.Payload, options: i.SendOptions = { volatile: true, response: true }) {
        const clients = this.filterClientsByState(onlineStates);
        const promises = Object.values(clients).map(client => {
            return this.send(client.clientId, eventName, payload, options);
        });
        return Promise.all(promises);
    }

    protected async send(
        clientId: string,
        eventName: string,
        payload: i.Payload = {},
        options: i.SendOptions = { response: true }
    ): Promise<i.Message | null> {
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
            id: await newMsgId(),
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
        return Object.values(this._clients).filter(client => {
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

    protected updateClientState(clientId: string, state: i.ClientState): boolean {
        if (this._clients[clientId] == null) {
            this.logger.debug(`${clientId} does not exist and cannot be updated`);
            return false;
        }

        const currentState = this._clients[clientId].state;
        if (currentState === state) {
            this.logger.debug(`${clientId} state of ${currentState} is the same, skipping update`);
            return false;
        }

        if (currentState === i.ClientState.Shutdown && state !== i.ClientState.Offline) {
            this.logger.debug(`${clientId} state of ${currentState} can only be updated to offline`);
            return false;
        }

        this._clients[clientId].state = state;

        const eventMsg = {
            scope: clientId,
            payload: {},
        };

        if (state === i.ClientState.Disconnected) {
            if (currentState === i.ClientState.Available) {
                this.logger.debug(`${clientId} is unavailable because it was marked as disconnected`);
                this.emit(`client:${i.ClientState.Unavailable}`, eventMsg);
            }

            this._clients[clientId].offlineAt = Date.now() + this.clientDisconnectTimeout;

            this.logger.trace(`${clientId} is disconnected will be considered offline in ${this.clientDisconnectTimeout}`);
        } else if (state === i.ClientState.Offline) {
            if (!disconnectedStates.includes(currentState)) {
                if (currentState === i.ClientState.Available) {
                    this.logger.trace(`${clientId} is unavailable because it was marked as offline`);
                    this.emit(`client:${i.ClientState.Unavailable}`, eventMsg);
                }

                this.logger.trace(`${clientId} is disconnected because it was marked as offline`);
                this.emit(`client:${i.ClientState.Disconnected}`, eventMsg);
            }
        }

        if (state === i.ClientState.Online) {
            this.emit('client:reconnect', eventMsg);
        } else {
            this.emit(`client:${state}`, eventMsg);
        }

        return true;
    }

    protected ensureClient(socket: SocketIO.Socket): i.ConnectedClient {
        const { clientId } = this.getClientMetadataFromSocket(socket);
        const client = this._clients[clientId];

        if (client) {
            this.updateClientState(clientId, i.ClientState.Online);
            return client;
        }

        const newClient: i.ConnectedClient = {
            clientId,
            state: i.ClientState.Online,
            offlineAt: null,
        };

        this.emit(`client:${i.ClientState.Online}`, { scope: clientId, payload: {} });

        this._clients[clientId] = newClient;
        return newClient;
    }

    private _onConnection(socket: SocketIO.Socket) {
        const client = this.ensureClient(socket);
        const { clientId } = client;

        socket.on('error', (error: Error | string) => {
            this.emit('client:error', {
                scope: clientId,
                payload: {},
                error,
            });
        });

        socket.on('disconnect', (error?: Error | string) => {
            if (error) {
                this.logger.info(`client ${clientId} disconnected`, { error });
            } else {
                this.logger.trace(`client ${clientId} disconnected`);
            }

            socket.removeAllListeners();
            socket.disconnect(true);

            if (this.isShuttingDown) {
                this.updateClientState(clientId, i.ClientState.Shutdown);
            } else {
                this.updateClientState(clientId, i.ClientState.Disconnected);
            }
        });

        this.handleResponse(socket, `client:${i.ClientState.Available}`, () => {
            this.updateClientState(clientId, i.ClientState.Available);
        });

        this.handleResponse(socket, `client:${i.ClientState.Unavailable}`, () => {
            this.updateClientState(clientId, i.ClientState.Unavailable);
        });

        this.handleResponse(socket, `client:${i.ClientState.Shutdown}`, () => {
            this.updateClientState(clientId, i.ClientState.Shutdown);
        });

        socket.on('message:response', (msg: i.Message) => {
            this.emit(msg.id, {
                scope: msg.from,
                payload: msg,
            });
        });

        this.emit('connection', {
            scope: clientId,
            payload: socket,
        });
    }
}

// @ts-ignore
function defaultRequestListener(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(501);
    res.end('Not Implemented');
}
