import debugFn from 'debug';
import { isString, isInteger } from 'lodash';
import SocketIOClient from 'socket.io-client';
import * as i from './interfaces';
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
    protected serverShutdown: boolean;

    constructor(opts: i.ClientOptions) {
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
            perMessageDeflate: false,
            query: { clientId, clientType },
            timeout: connectTimeout
        });

        // @ts-ignore
        this.socket = new SocketIOClient(hostUrl, options);

        this.hostUrl = hostUrl;
        this.connectTimeout = connectTimeout;
        this.clientId = clientId;
        this.clientType = clientType;
        this.serverName = serverName;
        this.available = false;
        this.ready = false;
        this.serverShutdown = false;
    }

    onServerShutdown(fn: () => void) {
        this.on('server:shutdown', async () => {
            this.serverShutdown = true;
            fn();
            setImmediate(() => {
                this.socket.close();
            });
        });
    }

    async connect() {
        if (this.socket.connected) {
            return;
        }

        await new Promise((resolve, reject) => {
            let connectTimeout: NodeJS.Timer | undefined;

            const cleanup = () => {
                if (connectTimeout != null) {
                    clearTimeout(connectTimeout);
                    connectTimeout = undefined;
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
                reject(new Error(`Unable to connect to ${this.hostUrl}`));
            }, this.connectTimeout);
        });

        this.socket.on('reconnecting', () => {
            debug(`client ${this.clientId} is reconnecting`);
            this.ready = false;
        });

        this.socket.on('reconnect', () => {
            debug(`client ${this.clientId} reconnected`);
            this.ready = true;
            this.emit('ready');

            if (!this.available) return;

            process.nextTick(async () => {
                try {
                    await this.sendAvailable();
                } catch (err) {
                    debug('update availablilty on reconnect error', err);
                }
            });
        });

        this.socket.on('disconnect', () => {
            debug(`client ${this.clientId} disconnected`);
            this.ready = false;
        });

        this.socket.on('shutdown', () => {
            debug(`server ${this.serverName} shutdown`);
            this.ready = false;
            this.serverShutdown = true;
            this.emit('server:shutdown');
        });

        this.socket.on('message:response', (msg: i.Message) => {
            this.emit(msg.id, {
                scope: msg.from,
                payload: msg,
            });
        });

        this.socket.on('connect', () => {
            debug(`client ${this.clientId} connected`);
            this.ready = true;
            this.emit('ready');
        });

        this.ready = true;
        this.emit('ready');

        debug(`client ${this.clientId} initial connect`);
    }

    async sendAvailable(payload?: i.Payload) {
        if (this.available) return;

        this.available = true;
        return this.send(`client:${i.ClientState.Available}`, payload, {
            volatile: true,
        });
    }

    async sendUnavailable(payload?: i.Payload) {
        if (!this.available) return;

        this.available = false;
        return this.send(`client:${i.ClientState.Unavailable}`, payload, {
            volatile: true,
        });
    }

    protected async send(eventName: string, payload: i.Payload = {}, options: i.SendOptions = { response: true }): Promise <i.Message | null> {
        if (this.serverShutdown || this.closed) return null;

        if (!this.ready && !options.volatile) {
            const connected = this.socket.connected ? 'connected' : 'not-connected';
            debug(`server is not ready and ${connected}, waiting for the ready event`);
            await this.onceWithTimeout(`ready:${this.serverName}`);
        }

        const response = options.response != null ? options.response : true;
        const respondBy = Date.now() + this.getTimeout(options.timeout);

        const message: i.Message = {
            id: newMsgId(),
            eventName,
            from: this.clientId,
            to: this.serverName,
            payload,
            volatile: options.volatile,
            response,
            respondBy,
        };

        const responseMsg = this.handleSendResponse(message);
        this.socket.emit(eventName, message);
        return responseMsg;
    }

    emit(eventName: string, msg: i.ClientEventMessage = { payload: {} }) {
        msg.scope = this.serverName;
        super.emit(`${eventName}`, msg as i.EventMessage);
    }

    isClientReady() {
        return !this.serverShutdown && this.ready;
    }

    async shutdown() {
        if (this.isClientReady()) {
            try {
                await this.send(`client:${i.ClientState.Shutdown}`, {}, {
                    volatile: true,
                    response: false,
                    timeout: 100,
                });
            } catch (err) {
                debug(`client send shutdown error ${err}`);
            }
        }

        this.ready = false;

        if (this.socket.connected) {
            this.socket.close();
        }

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
