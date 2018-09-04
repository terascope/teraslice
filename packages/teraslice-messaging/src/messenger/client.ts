import { isString } from 'lodash';
import SocketIOClient from 'socket.io-client';
import { Message, ClientOptions, Payload } from './interfaces';
import { Core } from './core';
import { newMsgId } from '../utils';

export class Client extends Core {
    readonly socket: SocketIOClient.Socket;
    readonly clientId: string;
    readonly clientType: string;
    readonly serverName: string;
    available: boolean;

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
    }

    async sendAvailable(payload?: Payload) {
        this.available = true;
        return this.send('client:available', payload);
    }

    async sendUnavailable(payload?: Payload) {
        this.available = false;
        return this.send('client:unavailable', payload);
    }

    protected async send(eventName: string, payload: Payload = {}, volatile?: boolean): Promise<Message> {
        const message: Message = {
            id: newMsgId(),
            payload,
            eventName,
            volatile,
            to: this.serverName,
            from: this.clientId,
        };

        const response = await new Promise((resolve, reject) => {
            this.socket.emit(eventName, message, this.handleSendResponse(resolve, reject));
        });

        return response as Message;
    }

    shutdown() {
        if (this.socket.connected) {
            this.socket.close();
        }
        this.close();
    }

    async onceWithTimeout(eventName: string, timeout?: number): Promise<any> {
        const timeoutMs = this.getTimeout(timeout);

        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.removeListener(eventName, _onceWithTimeout);
                resolve();
            }, timeoutMs);

            function _onceWithTimeout(param?: any) {
                clearTimeout(timer);
                resolve(param);
            }

            this.once(eventName, _onceWithTimeout);
        });
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
