import debugFn from 'debug';
import { isString, isInteger } from 'lodash';
import SocketIOClient from 'socket.io-client';
import { Message, ClientOptions, Payload, ClientState, SendOptions } from './interfaces';
import { Core } from './core';
import { newMsgId } from '../utils';

const debug = debugFn('teraslice-messaging:client');

export class Client extends Core {
    readonly socket: SocketIOClient.Socket;
    readonly clientId: string;
    readonly clientType: string;
    readonly serverName: string;
    readonly connectTimeout: number;
    readonly hostUrl: string;
    available: boolean;
    protected ready: boolean;

    constructor(opts: ClientOptions) {
        super(opts);
        const {
            hostUrl,
            clientId,
            clientType,
            serverName,
            socketOptions= {},
            connectTimeout,
        } = opts;

        if (!isString(hostUrl)) {
            throw new Error('Messenger.Client requires a valid hostUrl');
        }

        if (!isString(clientId)) {
            throw new Error('Messenger.Client requires a valid clientId');
        }

        if (!isString(clientType)) {
            throw new Error('Messenger.Client requires a valid clientType');
        }

        if (!isString(serverName)) {
            throw new Error('Messenger.Client requires a valid serverName');
        }

        if (!isInteger(connectTimeout)) {
            throw new Error('Messenger.Client requires a valid connectTimeout');
        }

        const options: SocketIOClient.ConnectOpts = Object.assign({}, socketOptions, {
            autoConnect: false,
            forceNew: true,
            query: { clientId, clientType },
            // transports: ['websocket'],
            timeout: connectTimeout
        });

        this.socket = SocketIOClient(hostUrl, options);

        this.hostUrl = hostUrl;
        this.connectTimeout = connectTimeout;
        this.clientId = clientId;
        this.clientType = clientType;
        this.serverName = serverName;
        this.available = false;
        this.ready = false;
    }

    async connect() {
        if (this.socket.connected) {
            return;
        }

        await new Promise((resolve, reject) => {
            let connectTimeout: NodeJS.Timer | undefined;

            const cleanup = () => {
                if (connectTimeout) {
                    clearTimeout(connectTimeout);
                }
                this.socket.removeListener('connect', connect);
            };

            const connect = () => {
                cleanup();
                resolve();
            };

            this.socket.once('connect', connect);
            this.socket.connect();

            connectTimeout = setTimeout(() => {
                cleanup();
                reject(new Error(`Unable to connecting to ${this.hostUrl}`));
            }, this.connectTimeout);
        });

        this.socket.on('reconnecting', () => {
            debug(`client ${this.clientId} is reconnecting`);
            this.ready = false;
        });

        this.socket.on('reconnect', async () => {
            debug(`client ${this.clientId} reconnected`);
            this.ready = true;
            this.emit('ready', this.serverName);

            try {
                if (this.available) {
                    await this.sendAvailable();
                } else {
                    await this.sendUnavailable();
                }
            } catch (err) {
                debug('update availablilty on reconnect error', err);
            }
        });

        this.socket.on('disconnect', () => {
            debug(`client ${this.clientId} disconnected`);
            this.ready = false;
        });

        this.socket.on('connect', async () => {
            debug(`client ${this.clientId} connected`);
            this.ready = true;
            this.emit('ready', this.serverName);

            try {
                if (this.available) {
                    await this.sendAvailable();
                } else {
                    await this.sendUnavailable();
                }
            } catch (err) {
                debug('update availablilty on connect error', err);
            }
        });

        this.ready = true;
        this.emit('ready', this.serverName);

        debug(`client ${this.clientId} initial connect`);
    }

    async sendAvailable(payload?: Payload) {
        this.available = true;
        return this.send(`client:${ClientState.Available}`, payload);
    }

    async sendUnavailable(payload?: Payload) {
        this.available = false;
        return this.send(`client:${ClientState.Unavailable}`, payload);
    }

    protected async send(eventName: string, payload: Payload = {}, options: SendOptions = { response: true }): Promise<Message|null> {
        if (!this.ready && !options.volatile) {
            const connected = this.socket.connected ? 'connected' : 'not-connected';
            debug(`server is not ready and ${connected}, waiting for the ready event`);
            await this.onceWithTimeout('ready');
        }

        const response = options.response != null ? options.response : true;

        const message: Message = {
            id: newMsgId(),
            respondBy: Date.now() + this.getTimeout(options.timeout),
            payload,
            eventName,
            volatile: options.volatile,
            response,
            to: this.serverName,
            from: this.clientId,
        };

        const responseMsg = await new Promise((resolve, reject) => {
            this.socket.emit(eventName, message, this.handleSendResponse(message, resolve, reject));
        });

        if (!responseMsg) return null;
        return responseMsg as Message;
    }

    isClientReady() {
        return this.ready;
    }

    async shutdown() {
        if (this.isClientReady()) {
            try {
                await this.send(`client:${ClientState.Shutdown}`, {}, {
                    volatile: true,
                    response: false,
                });
            } catch (err) {
                debug(`client send shutdown error ${err}`);
            }
        }

        this.ready = false;

        this.socket.close();
        this.close();
    }

    // For testing purposes
    forceReconnect() {
        return new Promise((resolve) => {
            this.socket.io.once('reconnect', () => {
                resolve();
            });
            // @ts-ignore
            this.socket.io.engine.close();
        });
    }
}
