import debugFn from 'debug';
import { isString } from 'lodash';
import SocketIOClient from 'socket.io-client';
import { Message, ClientOptions, Payload, ClientState } from './interfaces';
import { Core } from './core';
import { newMsgId } from '../utils';

const debug = debugFn('teraslice-messaging:client');

export class Client extends Core {
    readonly socket: SocketIOClient.Socket;
    readonly clientId: string;
    readonly clientType: string;
    readonly serverName: string;
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

        const options = Object.assign({}, socketOptions, {
            autoConnect: false,
            forceNew: true,
            query: { clientId, clientType },
            transports: ['websocket'],
        });

        this.socket = SocketIOClient(hostUrl, options);
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
            let connectErr: Error | undefined;
            let connectInterval: NodeJS.Timer | undefined;

            const cleanup = () => {
                if (connectInterval) {
                    clearInterval(connectInterval);
                }
                this.socket.removeListener('connect', connect);
                this.socket.removeListener('connect_error', connectError);
                this.socket.removeListener('connect_timeout', connectError);
            };

            const connect = () => {
                cleanup();
                resolve();
            };

            const connectError = (err: Error) => {
                connectErr = err;
            };

            this.socket.on('connect', connect);
            this.socket.on('connect_error', connectError);
            this.socket.on('connect_timeout', connectError);

            this.socket.connect();

            connectInterval = setInterval(() => {
                cleanup();
                reject(connectErr);
            }, this.actionTimeout);
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

    protected async send(eventName: string, payload: Payload = {}, volatile?: boolean): Promise<Message> {
        if (!this.ready && !volatile) {
            const connected = this.socket.connected ? 'connected' : 'not-connected';
            debug(`server is not ready and ${connected}, waiting for the ready event`);
            await this.onceWithTimeout('ready');
        }

        const message: Message = {
            id: newMsgId(),
            respondBy: Date.now() + this.getTimeout(),
            payload,
            eventName,
            volatile,
            to: this.serverName,
            from: this.clientId,
        };

        const response = await new Promise((resolve, reject) => {
            this.socket.emit(eventName, message, this.handleSendResponse(message, resolve, reject));
        });

        return response as Message;
    }

    isClientReady() {
        return this.ready;
    }

    async shutdown() {
        if (this.socket.connected) {
            try {
                await this.send(`client:${ClientState.Shutdown}`, {}, true);
            } catch (err) {
                debug(`client send shutdown error ${err}`);
            }
        }
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
