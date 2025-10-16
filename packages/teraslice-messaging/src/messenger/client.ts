/* eslint-disable prefer-const */

import ms from 'ms';
import {
    io as SocketIOClient, ManagerOptions,
    Socket, SocketOptions
} from 'socket.io-client';
import {
    isString, isInteger, debugLogger, toString
} from '@terascope/utils';
import * as i from './interfaces.js';
import { Core } from './core.js';
import { newMsgId } from '../utils/index.js';

const _logger = debugLogger('teraslice-messaging:client');

export class Client extends Core {
    readonly socket: Socket;
    readonly clientId: string;
    readonly clientType: string;
    readonly serverName: string;
    readonly connectTimeout: number;
    readonly hostUrl: string;
    available: boolean;
    ready: boolean;
    protected serverShutdown: boolean;

    // FIXME: why this other timeout that is never set?
    constructor(opts: i.ClientOptions, _connectTimeout?: number) {
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

        const options: Partial<ManagerOptions & SocketOptions> = Object.assign({}, socketOptions, {
            autoConnect: false,
            forceNew: true,
            perMessageDeflate: false,
            auth: { clientId, clientType },
            timeout: _connectTimeout // FIXME: we never set this
        });

        this.socket = SocketIOClient(hostUrl, options);
        this.socket.io.on('error', (err: any) => {
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

    onServerShutdown(fn: () => void): void {
        this.on('server:shutdown', () => {
            this.serverShutdown = true;
            try {
                fn();
            } catch (err) {
                this.logger.error(err);
            }
            process.nextTick(() => {
                this.socket.close();
            });
        });
    }

    async connect(): Promise<void> {
        if (this.socket.connected) {
            return;
        }

        await this._connect(this.connectTimeout);

        this.socket.io.on('reconnect_attempt', () => {
            this.logger.debug(`client ${this.clientId} is reconnecting...`);
            this.ready = false;
        });

        this.socket.io.on('reconnect', () => {
            this.logger.info(`client ${this.clientId} reconnected`);
            this.serverShutdown = false;
            this.ready = true;
            this.emit('ready');

            if (!this.available) return;

            process.nextTick(async () => {
                try {
                    await this.sendAvailable();
                } catch (err) {
                    this.logger.warn(err, 'update availability on reconnect error');
                }
            });
        });

        this.socket.on('disconnect', (reason: string) => {
            this.logger.info(`client ${this.clientId} disconnected`, reason ? { reason } : undefined);
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

    private async _connect(remainingTimeout: number, attempt = 1): Promise<void> {
        const connectToStr = `${this.serverName} at ${this.hostUrl}`;
        if (this.socket.connected) {
            return;
        }

        if (attempt > 1) {
            this.logger.debug(`attempt #${attempt} connecting to ${connectToStr}`, {
                remainingTimeout
            });
        } else {
            this.logger.debug(`attempting to connect to ${connectToStr}`);
        }

        const startTime = Date.now();
        await new Promise<void>((resolve, reject) => {
            let timer: any;
            let cleanup: () => void;

            const onError = (err: any) => {
                const errStr = toString(err).replace('Error: ', '');
                // connect_timeout event replaced by connect_error event with timeout message
                if (errStr.includes('timeout')) {
                    this.logger.debug(`timeout when connecting to ${connectToStr}, reconnecting...`);
                    cleanup();
                    resolve();
                } else if (errStr.includes('xhr poll error')) {
                    // it still connecting so this is probably okay
                    this.logger.debug(`${errStr} when connecting to ${connectToStr}`);
                } else {
                    this.logger.warn(`${errStr} when connecting to ${connectToStr}`);
                }
            };

            cleanup = () => {
                clearTimeout(timer);
                this.socket.removeListener('connect_error', onError);
                this.socket.removeListener('connect', onConnect);
            };

            function onConnect() {
                cleanup();
                resolve();
            }

            this.socket.on('connect_error', onError);
            this.socket.once('connect', onConnect);
            this.socket.connect();

            timer = setTimeout(() => {
                if (this.socket.connected) return;
                cleanup();
                reject(new Error(`Unable to connect to ${connectToStr} after ${ms(this.connectTimeout)}`));
            }, remainingTimeout);
        });

        const elapsed = Date.now() - startTime;
        const remaining = remainingTimeout - elapsed;
        return this._connect(remaining, attempt + 1);
    }

    async sendAvailable(payload?: i.Payload): Promise<i.Message | null | undefined> {
        if (this.available) return;

        this.available = true;
        return this.send(`client:${i.ClientState.Available}`, payload, {
            volatile: true,
        });
    }

    async sendUnavailable(payload?: i.Payload): Promise<i.Message | null | undefined> {
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
            await this.onceWithTimeout(`ready:${this.serverName}`); // FIXME: if this times out we still send message???
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

        const responseMsg = this.handleSendResponse(message, options.sendAbortSignal);
        this.socket.emit(eventName, message);
        return responseMsg;
    }

    emit(eventName: string, msg: i.ClientEventMessage = { payload: {} }): void {
        msg.scope = this.serverName;
        super.emit(`${eventName}`, msg as i.EventMessage);
    }

    isClientReady(): boolean {
        return !this.serverShutdown && this.ready;
    }

    async shutdown(): Promise<void> {
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
    forceReconnect(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.socket.io.once('reconnect', () => {
                resolve();
            });
            this.socket.io.engine.close();
        });
    }
}
