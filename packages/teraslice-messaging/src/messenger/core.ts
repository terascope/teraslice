import { toString, isInteger, debugLogger } from '@terascope/utils';
import { EventEmitter } from 'events';
import pEvent from 'p-event';
import * as i from './interfaces';

const logger = debugLogger('teraslice-messaging:core');

export class Core extends EventEmitter {
    public closed: boolean = false;

    protected networkLatencyBuffer: number;
    protected actionTimeout: number;

    constructor(opts: i.CoreOptions) {
        super();

        this.networkLatencyBuffer = opts.networkLatencyBuffer || 0;
        this.actionTimeout = opts.actionTimeout;

        if (!isInteger(this.actionTimeout) || !this.actionTimeout) {
            throw new Error('Messenger requires a valid actionTimeout');
        }

        if (!isInteger(this.networkLatencyBuffer)) {
            throw new Error('Messenger requires a valid networkLatencyBuffer');
        }
    }

    close() {
        this.closed = true;
        this.removeAllListeners();
    }

    protected async handleSendResponse(sent: i.Message): Promise<i.Message|null> {
        if (!sent.response) return null;
        logger.trace('waiting for response from message', sent);

        const remaining = sent.respondBy - Date.now();
        const response = await this.onceWithTimeout(sent.id, remaining);

        // it is a timeout
        if (response == null) {
            if (sent.volatile || this.closed) {
                return null;
            }
            throw new Error(`Timed out after ${remaining}ms, waiting for message "${sent.eventName}"`);
        }

        if (response.error) {
            throw new Error(`${sent.eventName} Message Response Failure: ${response.error}`);
        }

        return response;
    }

    protected handleResponse(socket: i.SocketEmitter, eventName: string, fn: i.MessageHandler) {
        logger.trace(`registering response handler for ${eventName}`);

        socket.on(eventName, async (msg: i.Message) => {
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
                message.error = toString(err);
            }

            if (!msg.response) {
                return;
            }

            if (!msg.volatile && !this.isClientReady(message.to)) {
                const remaining = msg.respondBy - Date.now();
                await this.waitForClientReady(message.to, remaining);
            }

            // @ts-ignore
            socket.emit('message:response', message);
        });
    }

    isClientReady(clientId?: string): boolean {
        logger.error('isClientReady should be implemented on the server and client class', clientId);
        throw new Error('isClientReady should be implemented on the server and client class');
    }

    async waitForClientReady(clientId: string, timeout?: number): Promise<boolean> {
        if (this.isClientReady(clientId)) {
            return true;
        }

        logger.trace(`waiting for ${clientId} to be ready`);
        await this.onceWithTimeout(`ready:${clientId}`, timeout);
        const isReady = this.isClientReady(clientId);
        if (!isReady) {
            throw new Error(`Client ${clientId} is not ready`);
        }
        return isReady;
    }

    getTimeoutWithMax(maxTimeout: number): number {
        const timeout = this.getTimeout();
        return timeout > maxTimeout ? maxTimeout : timeout;
    }

    getTimeout(timeout?: number): number {
        return (timeout || this.actionTimeout) + this.networkLatencyBuffer;
    }

    // @ts-ignore
    emit(eventName: string, msg: i.EventMessage) {
        super.emit(`${eventName}`, msg);
        if (msg.scope) {
            super.emit(`${eventName}:${msg.scope}`, msg);
        }
    }

    async onceWithTimeout(eventName: string, timeout?: number): Promise<any> {
        const timeoutMs: number = this.getTimeout(timeout);
        try {
            const { payload } = await pEvent(this, eventName, {
                rejectionEvents: [],
                timeout: timeoutMs
            }) as i.EventMessage;
            return payload;
        } catch (err) {
            return undefined;
        }
    }
}
