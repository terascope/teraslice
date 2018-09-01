import _ from 'lodash';
import { EventEmitter } from 'events';
import * as i from './interfaces';

export class Core extends EventEmitter {
    public closed: boolean = false;

    protected networkLatencyBuffer: number;
    protected actionTimeout: number;

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
    }

    close() {
        this.closed = true;
        this.removeAllListeners();
    }

    protected handleSendResponse(resolve: (val?: i.Message) => void, reject: (err: Error) => void) {
        const timeoutMs = this.getTimeout();
        const timeoutError = new Error(`Timed out after ${timeoutMs}ms, waiting for message`);

        const timeout = setTimeout(() => {
            reject(timeoutError);
        }, timeoutMs);

        const responseError = new Error(`Message Response Failure`);
        return (response: i.Message) => {
            clearTimeout(timeout);
            if (response.error) {
                responseError.message += `: ${response.error}`;
                // @ts-ignore
                responseError.response = response;
                reject(responseError);
            } else {
                resolve(response);
            }
        };
    }

    protected handleResponse(fn: i.MessageHandler) {
        return async (msg: i.Message, callback: (msg?: i.Message) => void) => {
            const message: i.Message = Object.assign({}, msg, {
                from: msg.to,
                to: msg.from,
                payload: {},
            });

            try {
                const payload = await fn(msg);
                if (payload) {
                    message.payload = payload;
                }
            } catch (err) {
                message.error = _.toString(err);
            }

            callback(message);
        };
    }

    protected getTimeout(timeout?: number): number {
        return (timeout || this.actionTimeout) + this.networkLatencyBuffer;
    }
}
