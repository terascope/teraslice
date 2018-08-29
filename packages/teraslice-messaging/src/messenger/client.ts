import { isString } from 'lodash';
import SocketIOClient from 'socket.io-client';
import { Message, ClientOptions } from './interfaces';
import { Core } from './core';

export class Client extends Core {
    readonly socket: SocketIOClient.Socket;
    readonly clientId: string;

    constructor(opts: ClientOptions) {
        super(opts);
        const {
            hostUrl,
            clientId,
            socketOptions={},
        } = opts;

        if (!isString(hostUrl)) {
            throw new Error('Messenger.Client requires a valid hostUrl');
        }

        if (!isString(clientId)) {
            throw new Error('Messenger.Client requires a valid clientId');
        }

        const options = Object.assign({}, socketOptions, {
            autoConnect: false,
            forceNew: true,
            query: { clientId }
        });

        this.socket = SocketIOClient(hostUrl, options);
        this.clientId = clientId;
    }

    shutdown() {
        if (this.socket.connected) {
            this.socket.close();
        }
        this.close();
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

        this.socket.on('messaging:response', (msg: Message) => {
            this.emit(msg.__msgId, msg)
        });
    }

    async ready() {
        return this.send({ message: 'client:ready' });
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
