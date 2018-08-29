import _ from 'lodash';
import { EventEmitter } from 'events';
import { newMsgId } from '../utils';
import * as i from './interfaces';

export class Core extends EventEmitter {
    public closed: boolean = false;
    public socket?: SocketIOClient.Socket;
    public server?: SocketIO.Server;

    protected networkLatencyBuffer: number;
    protected actionTimeout: number;
    protected source: string;
    protected to: string;

    constructor(opts: i.CoreOptions) {
        super();

        this.networkLatencyBuffer = opts.networkLatencyBuffer || 0;
        this.actionTimeout = opts.actionTimeout;

        if (!_.isSafeInteger(this.actionTimeout) || !this.actionTimeout) {
            throw new Error('Messenger requires a valid actionTimeout');
        }

        if (!_.isSafeInteger(this.networkLatencyBuffer)) {
            throw new Error('Messenger requires a valid networkLatencyBuffer');
        }

        this.source = opts.source;
        this.to = opts.to;
    }

    public close() {
        this.closed = true;
        this.removeAllListeners();
    }

    public send(msg: i.InputMessage) {
        const message = this._buildMessage(msg);

        return this._sendMessage(message);
    }

    public async sendWithResponse(msg: i.InputMessage, options: i.SendWithResponseOptions = {}) {
        const message = this._buildMessage(msg, {
            response: true,
        });
        const msgId = message.__msgId;

        let shouldRetry = false;

        const _onReconnect = async () => {
            const retryMsg = _.cloneDeep(message);
            shouldRetry = true;
            _.set(retryMsg, 'payload.retry', true);
            await this._sendMessage(retryMsg);
        };

        const _waitForResponse = async (): Promise<object | undefined> => {
            const response = await this.onceWithTimeout(msgId, options.timeoutMs, true) as i.Message;
            if (response == null) {
                if (shouldRetry) {
                    shouldRetry = false;
                    return _waitForResponse();
                }

                if (this.closed) return;

                throw new Error(`Timeout error while communicating with ${message.address}, with message: ${JSON.stringify(message)}`);
            }

            if (response.error) {
                throw new Error(response.error);
            }

            return response.payload;
        };

        await this._sendMessage(message);

        if (options.retry && this.socket) {
            this.socket.on('reconnect', _onReconnect);
        }

        let response;

        try {
            response = await _waitForResponse();
        } finally {
            if (options.retry && this.socket) {
                this.socket.removeListener('reconnect', _onReconnect);
            }
        }

        return response;
    }

    public respond(incoming: i.InputMessage, outgoing?: object) {
        const response: i.Message = Object.assign({}, outgoing, {
            __msgId: incoming.__msgId,
            __source: incoming.__source,
            to: incoming.__source || this.to,
            message: 'messaging:response',
        });
        return this._sendMessage(response, incoming.__source);
    }

    public async onceWithTimeout(eventName: string, timeout?: number, skipError?: boolean): Promise<object | undefined> {
        const timeoutMs = this._getTimeout(timeout);

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.removeListener(eventName, onMessage);
                if (skipError) {
                    resolve();
                    return;
                }
                const error = new Error(`Timed out after ${timeoutMs}ms, waiting for event "${eventName}"`);
                reject(error);
            }, timeoutMs);

            function onMessage(msg: object) {
                clearTimeout(timer);
                resolve(msg);
            }

            this.once(eventName, onMessage);
        });
    }

    private _sendMessage(message: i.InputMessage, override?: string): void {
        if (this.server) {
            const room = override || message.address;
            if (!room) {
                throw new Error('Unable to send message');
            }
            this.server.sockets.in(room).emit(message.message, message);
        }

        if (this.socket) {
            this.socket.emit(message.message, message);
        }
    }

    protected _getTimeout(timeout?: number): number {
        return (timeout || this.actionTimeout) + this.networkLatencyBuffer;
    }

    protected _buildMessage(msg: i.InputMessage, override?: object): i.Message {
        return Object.assign({
            __msgId: newMsgId(),
            __source: this.source,
            to: this.to,
        }, msg, override);
    }
}
