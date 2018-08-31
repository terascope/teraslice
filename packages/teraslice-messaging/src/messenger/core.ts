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

    protected handleSendResponse(resolve: (val?: i.Message) => void, reject: (err: Error) => void): i.SendHandler {
        const timeout = setTimeout(() => {
            reject(new Error('Timed out after 1000ms, waiting for message'));
        }, this.getTimeout());

        return (err: i.ResponseError, response: any) => {
            clearTimeout(timeout);
            if (err) {
                reject(new Error(`Message Response Failure: ${err}`));
            } else {
                resolve(response);
            }
        };
    }

    protected handleResponse(fn: i.MessageHandler): i.ResponseHandler {
        return async (msg: i.Message, callback: i.CallbackFn): Promise<void> => {
            if (msg.volatile) {
                await fn(msg);
            }

            try {
                const payload = await fn(msg);
                callback(null, {
                    id: msg.id,
                    from: msg.to,
                    to: msg.from,
                    eventName: msg.eventName,
                    payload: payload || {},
                });
            } catch (err) {
                callback(_.toString(err));
            }
        };
    }

    protected getTimeout(timeout?: number): number {
        return (timeout || this.actionTimeout) + this.networkLatencyBuffer;
    }
}
