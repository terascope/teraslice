import { isEmpty, isString } from 'lodash';
import SocketIOClient from 'socket.io-client';
import { Message, ClientOptions } from './interfaces';
import { Core } from './core';

export class Client extends Core {
    public socket: SocketIOClient.Socket;

    constructor(opts: ClientOptions) {
        super(opts);
        const {
            hostUrl,
            socketOptions,
        } = opts;

        if (!isString(hostUrl)) {
            throw new Error('Messenger.Client requires a valid hostUrl');
        }

        if (isEmpty(socketOptions)) {
            throw new Error('Messenger.Client requires a valid socketOptions');
        }

        const options = Object.assign({}, socketOptions, { forceNew: true });

        this.socket = SocketIOClient(hostUrl, options);
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

        this.handleResponses(this.socket);
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

    public handleResponses(socket: SocketIOClient.Socket): void {
        const emitResponse = (msg: Message) => {
            /* istanbul ignore if */
            if (!msg.__msgId) {
                console.error('Messaging response requires an a msgId'); // eslint-disable-line
                return;
            }
            this.emit(msg.__msgId, msg);
        };

        socket.on('messaging:response', emitResponse);

        if (this.to === 'cluster_master') {
            socket.on('networkMessage', (msg: Message) => {
                if (msg.message === 'messaging:response') {
                    emitResponse(msg);
                    return;
                }
                this.emit(msg.message, msg);
            });
        }
    }
}
