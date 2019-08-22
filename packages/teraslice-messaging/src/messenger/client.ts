import ms from 'ms';
import SocketIOClient from 'socket.io-client';
import { isString, isInteger, debugLogger, toString } from '@terascope/utils';
import * as i from './interfaces';
import { Core } from './core';
import { newMsgId } from '../utils';

const _logger = debugLogger('teraslice-messaging:client');

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
        const {
            hostUrl,
            clientId,
            clientType,
            serverName,
            socketOptions = {},
            connectTimeout,
            clientDisconnectTimeout,
            logger,
            ...coreOpts
        } = opts;

        super({
            logger: logger
                ? logger.child({
                    module: 'messaging:client',
                })
                : _logger,
            ...coreOpts,
        });

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

        // The pingTimeout should be the client disconnect timeout
        // (which is greater than the pingTimeout on the server which uses actionTimeout)
        // to avoid disconnecting from the server before the connection
        // is considered
        const pingTimeout = clientDisconnectTimeout;
        const pingInterval = clientDisconnectTimeout + this.networkLatencyBuffer;

        const options: SocketIOClient.ConnectOpts = Object.assign({}, socketOptions, {
            autoConnect: false,
            forceNew: true,
            pingTimeout,
            pingInterval,
            perMessageDeflate: false,
            query: { clientId, clientType },
            timeout: connectTimeout,
        });

        this.socket = SocketIOClient(hostUrl, options);
        this.socket.on('error', (err: any) => {
            this.logger.error(err, 'unhandled socket.io-client error');
        });

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
        this.on('server:shutdown', () => {
            this.serverShutdown = true;
            try {
                fn();
            } catch (err) {
                this.logger.error(err);
            }
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
            let connectTimeout: any;

            const cleanup = () => {
                if (connectTimeout != null) {
                    clearTimeout(connectTimeout);
                    connectTimeout = undefined;
                }
                this.socket.removeListener('connect_error', onError);
                this.socket.removeListener('connect_timeout', onError);
                this.socket.removeListener('connect', onConnect);
            };

            const onConnect = () => {
                cleanup();
                resolve();
            };

            const onError = (err: any) => {
                // it still connecting so this is probably okay
                this.logger.debug(`${toString(err)} when connecting to ${this.serverName} at ${this.hostUrl}`);
            };

            this.socket.once('connect_error', onError);
            this.socket.once('connect_timeout', onError);
            this.socket.once('connect', onConnect);
            this.socket.connect();

            connectTimeout = setTimeout(() => {
                cleanup();
                reject(new Error(`Unable to connect to ${this.serverName} at ${this.hostUrl} after ${ms(this.connectTimeout)}`));
            }, this.connectTimeout);

            this.logger.debug(`attempting to ${this.serverName} at ${this.hostUrl}`);
        });

        this.socket.on('reconnecting', () => {
            this.logger.debug(`client ${this.clientId} is reconnecting...`);
            this.ready = false;
        });

        this.socket.on('reconnect', () => {
            this.logger.info(`client ${this.clientId} reconnected`);
            this.ready = true;
            this.emit('ready');

            if (!this.available) return;

            process.nextTick(async () => {
                try {
                    await this.sendAvailable();
                } catch (err) {
                    this.logger.warn(err, 'update availablilty on reconnect error');
                }
            });
        });

        this.socket.on('disconnect', (reason: string) => {
            this.logger.info(`client ${this.clientId} disconnected`, { reason });
            this.ready = false;
        });

        this.socket.on('shutdown', () => {
            this.logger.debug(`server ${this.serverName} shutdown`);
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
            this.logger.info(`client ${this.clientId} connected`);
            this.ready = true;
            this.emit('ready');
        });

        this.ready = true;
        this.emit('ready');

        this.logger.debug(`client ${this.clientId} connect`);
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

    protected async send(
        eventName: string,
        payload: i.Payload = {},
        options: i.SendOptions = { response: true }
    ): Promise<i.Message | null> {
        if (this.serverShutdown || this.closed) return null;

        if (!this.ready && !options.volatile) {
            const connected = this.socket.connected ? 'connected' : 'not-connected';
            this.logger.debug(`server is not ready and ${connected}, waiting for the ready event`);
            await this.onceWithTimeout(`ready:${this.serverName}`);
        }

        const response = options.response != null ? options.response : true;
        const respondBy = Date.now() + this.getTimeout(options.timeout);

        const message: i.Message = {
            id: await newMsgId(),
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
                await this.send(
                    `client:${i.ClientState.Shutdown}`,
                    {},
                    {
                        volatile: true,
                        response: false,
                        timeout: 100,
                    }
                );
            } catch (err) {
                this.logger.error(err, 'client send shutdown error');
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
