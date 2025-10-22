import http from 'node:http';
import { Server as SocketIOServer, type Socket, ExtendedError } from 'socket.io';
import {
    get,
    isTest,
    isString,
    isNumber,
    debugLogger,
    pDelay,
    pRetry,
} from '@terascope/core-utils';
import { newMsgId } from '../utils/index.js';
import * as i from './interfaces.js';
import { Core } from './core.js';

const _logger = debugLogger('teraslice-messaging:server');

const disconnectedStates = [i.ClientState.Disconnected, i.ClientState.Shutdown];

const unavailableStates = [i.ClientState.Unavailable, ...disconnectedStates];

const onlineStates = [i.ClientState.Online, i.ClientState.Available, i.ClientState.Unavailable];

export class Server extends Core {
    isShuttingDown: boolean;
    readonly port: number;
    readonly server: SocketIOServer<i.ClientToServerEvents, i.ServerToClientEvents>;
    readonly httpServer: http.Server;
    readonly serverName: string;
    readonly clientDisconnectTimeout: number;
    private _cleanupClients: any;
    protected _clients: i.ConnectedClients;

    constructor(opts: i.ServerOptions) {
        const {
            port,
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
        const pingTimeout = this.actionTimeout;
        const pingInterval = this.actionTimeout + this.networkLatencyBuffer;

        this.server = new SocketIOServer({
            pingTimeout,
            pingInterval,
            perMessageDeflate: false,
            serveClient: false,
            maxHttpBufferSize: 1e8, // 100MB - socketIO v1 default
        });

        this.server.on('error', (err: any) => {
            this.logger.error(err, 'unhandled socket.io error');
        });

        this.httpServer = http.createServer(requestListener);

        if (serverTimeout) {
            this.httpServer.timeout = serverTimeout;
        }

        this.isShuttingDown = false;

        this._clients = {};
        this._onConnection = this._onConnection.bind(this);
    }

    async listen(): Promise<void> {
        // Check if port is available before using it
        const testPort = async function (port: number) {
            return new Promise((resolve) => {
                const portTestServer = http.createServer();

                portTestServer.unref();

                portTestServer.once('error', () => {
                    portTestServer.close(() => {
                        return resolve(false);
                    });
                });

                portTestServer.once('listening', () => {
                    portTestServer.close(() => {
                        return resolve(true);
                    });
                });

                portTestServer.listen(port);
            });
        };

        await pRetry(async () => {
            const portAvailable = await testPort(this.port);
            if (!portAvailable) {
                throw new Error(`Port ${this.port} is already in-use`);
            }
        }, {
            retries: isTest ? 1 : 5,
            endWithFatal: true,
            logError: (err: any, ...args) => {
                this.logger.warn(err, ...args);
            }
        });

        await new Promise<void>((resolve, reject) => {
            this.httpServer.listen(this.port, (err?: Error) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        this.server.attach(this.httpServer);

        this.server.use(
            (socket: Socket<i.ClientToServerEvents, i.ServerToClientEvents>,
                next: (err?: ExtendedError) => void
            ) => {
                socket.join(socket.handshake.auth.clientId as string);
                next();
            }
        );

        this.server.on('connection', this._onConnection);

        this.onClientReconnect((clientId) => {
            this.emit('ready', { scope: clientId, payload: {} });
        });

        this.onClientOnline((clientId) => {
            this.emit('ready', { scope: clientId, payload: {} });
        });

        this._cleanupClients = setInterval(
            () => {
                for (const { clientId, state } of Object.values(this._clients)) {
                    if (state === i.ClientState.Shutdown) {
                        this.updateClientState(clientId, i.ClientState.Disconnected);
                    }
                }
            },
            isTest ? 100 : 5000
        );
    }

    async shutdown(): Promise<void> {
        this.isShuttingDown = true;

        if (this._cleanupClients != null) {
            clearInterval(this._cleanupClients);
            this._cleanupClients = undefined;
        }

        if (this.closed) {
            this._clients = {};
            return;
        }

        this.server.volatile.emit('shutdown');
        await pDelay(isTest ? 100 : 5000);
        this.server.close();
        this.httpServer.close();
        this._clients = {};

        super.close();
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

    get disconnectedClientCount(): number {
        return this.countClientsByState(disconnectedStates);
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

    onClientOnline(fn: (clientId: string) => void): this {
        return this.on(`client:${i.ClientState.Online}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientAvailable(fn: (clientId: string) => void): this {
        return this.on(`client:${i.ClientState.Available}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientUnavailable(fn: (clientId: string) => void): this {
        return this.on(`client:${i.ClientState.Unavailable}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientDisconnect(fn: (clientId: string) => void): this {
        return this.on(`client:${i.ClientState.Disconnected}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientShutdown(fn: (clientId: string) => void): this {
        return this.on(`client:${i.ClientState.Shutdown}`, (msg) => {
            fn(msg.scope);
        });
    }

    onClientReconnect(fn: (clientId: string) => void): this {
        return this.on('client:reconnect', (msg) => {
            fn(msg.scope);
        });
    }

    onClientError(fn: (clientId: string) => void): this {
        return this.on('client:error', (msg) => {
            fn(msg.scope);
        });
    }

    isClientReady(clientId: string): boolean {
        const clientState = get(this._clients, [clientId, 'state']);
        return onlineStates.includes(clientState);
    }

    protected sendToAll(
        eventName: string,
        payload?: i.Payload,
        options: i.SendOptions = { volatile: true, response: true }
    ): Promise<(i.Message | null)[]> {
        const clients = this.filterClientsByState(onlineStates);
        const promises = Object.values(clients)
            .map((client) => this.send(client.clientId, eventName, payload, options));
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
        return onlineStates.includes(state);
    }

    protected getClientMetadataFromSocket(
        socket: Socket<i.ClientToServerEvents, i.ServerToClientEvents>
    ): i.ClientSocketMetadata {
        return {
            clientId: socket.handshake.auth.clientId as string,
            clientType: socket.handshake.auth.clientType as string,
        };
    }

    private filterClientsByState(states: i.ClientState[]): i.ConnectedClient[] {
        return Object.values(this._clients).filter((client) => states.includes(client.state));
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
            this.logger.debug(`client ${clientId} does not exist and cannot be updated to ${state}`);
            return false;
        }

        const currentState = this._clients[clientId].state;
        if (currentState === state) {
            this.logger.debug(`client ${clientId} state of ${currentState} is the same, skipping update`);
            return false;
        }

        if (currentState === i.ClientState.Shutdown && state !== i.ClientState.Disconnected) {
            this.logger.warn(`client ${clientId} is ${currentState} cannot be updated to ${state}`);
            return false;
        }

        this._clients[clientId].state = state;

        const eventMsg = {
            scope: clientId,
            payload: {},
        };

        if (state === i.ClientState.Online) {
            this.emit('client:reconnect', eventMsg);
        } else {
            this.emit(`client:${state}`, eventMsg);
        }

        return true;
    }

    protected ensureClient(
        socket: Socket<i.ClientToServerEvents, i.ServerToClientEvents>
    ): i.ConnectedClient {
        const { clientId } = this.getClientMetadataFromSocket(socket);
        const client = this._clients[clientId];

        if (client) {
            this.logger.info(`client ${clientId} reconnected`);
            this.updateClientState(clientId, i.ClientState.Online);
            return client;
        }

        const newClient: i.ConnectedClient = {
            clientId,
            state: i.ClientState.Online,
        };

        this.emit(`client:${i.ClientState.Online}`, { scope: clientId, payload: {} });

        this._clients[clientId] = newClient;
        return newClient;
    }

    private _onConnection(socket: Socket<i.ClientToServerEvents, i.ServerToClientEvents>) {
        const client = this.ensureClient(socket);
        const { clientId } = client;

        socket.on('error', (error: Error | string) => {
            this.emit('client:error', {
                scope: clientId,
                payload: {},
                error,
            });
        });

        socket.on('disconnect', (reason: string) => {
            this.logger.info(`client ${clientId} disconnected`, { reason });

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

function defaultRequestListener(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(501);
    res.end('Not Implemented');
}
