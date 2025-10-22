import ms from 'ms';
import { pEvent } from 'p-event';
import { EventEmitter } from 'node:events';
import {
    toString, isInteger, debugLogger,
    Logger, TSError
} from '@terascope/core-utils';
import * as i from './interfaces.js';

const _logger = debugLogger('teraslice-messaging:core');

export class Core extends EventEmitter {
    public closed = false;

    protected networkLatencyBuffer: number;
    protected actionTimeout: number;
    protected logger: Logger;

    constructor(opts: i.CoreOptions) {
        super();

        this.logger = opts.logger || _logger;
        this.networkLatencyBuffer = opts.networkLatencyBuffer || 0;
        this.actionTimeout = opts.actionTimeout;

        if (!isInteger(this.actionTimeout) || !this.actionTimeout) {
            throw new Error('Messenger requires a valid actionTimeout');
        }

        if (!isInteger(this.networkLatencyBuffer)) {
            throw new Error('Messenger requires a valid networkLatencyBuffer');
        }

        this.on('error', (err: any) => {
            this.logger.error(err, 'unhandled teraslice-messenger error');
        });
    }

    close(): void {
        this.closed = true;
        this.removeAllListeners();
    }

    protected async handleSendResponse(
        sent: i.Message,
        sendAbortSignal = false
    ): Promise<i.Message | null> {
        if (!sent.response) return null;

        const remaining = sent.respondBy - Date.now();
        let response;
        if (sendAbortSignal) {
            const abortController = new AbortController();
            const abortFn = () => {
                // this will send an abort signal to the onceWithTimeout pEvent
                // allowing the worker to shutdown without receiving a response to
                // the message
                this.logger.info(`Aborting the awaiting of a response to ${sent.eventName}`);
                abortController.abort();
            };
            this.addListener('server:shutdown', abortFn);

            response = await this.onceWithTimeout(sent.id, remaining, abortController.signal);

            // server shutdown
            if (abortController.signal.aborted) {
                const msg = sent.eventName === 'worker:slice:complete'
                    ? `Execution controller shutdown before receiving worker slice analytics. Event: "${sent.eventName}"`
                    : `Execution controller shutdown before receiving "${sent.eventName}" event`;
                throw new TSError(msg, { retryable: false });
            }

            this.removeListener('server:shutdown', abortFn);
        } else {
            response = await this.onceWithTimeout(sent.id, remaining);
        }

        // it is a timeout
        if (response == null) {
            if (sent.volatile || this.closed) {
                return null;
            }
            throw new Error(`Timed out after ${ms(remaining)}, waiting for message "${sent.eventName}"`);
        }

        if (response.error) {
            throw new Error(`${sent.eventName} Message Response Failure: ${response.error}`);
        }

        return response;
    }

    protected handleResponse(
        socket: i.SocketEmitter, eventName: string, fn: i.MessageHandler
    ): void {
        this.logger.trace(`registering response handler for ${eventName}`);

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
                try {
                    await this.waitForClientReady(message.to, remaining);
                } catch (err) {
                    // don't throw an unhandledRejection because the client isn't ready
                    this.logger.error(err);
                }
            }

            socket.emit('message:response', message);
        });
    }

    isClientReady(clientId?: string): boolean {
        this.logger.error('isClientReady should be implemented on the server and client class', clientId);
        throw new Error('isClientReady should be implemented on the server and client class');
    }

    async waitForClientReady(clientId: string, timeout?: number): Promise<boolean> {
        if (this.isClientReady(clientId)) {
            return true;
        }

        this.logger.trace(`waiting for ${clientId} to be ready`);
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

    // @ts-expect-error
    emit(eventName: string, msg: i.EventMessage): void {
        super.emit(`${eventName}`, msg);
        if (msg.scope) {
            super.emit(`${eventName}:${msg.scope}`, msg);
        }
    }

    async onceWithTimeout(
        eventName: string,
        timeout?: number,
        abortSignal?: AbortSignal
    ): Promise<any> {
        const timeoutMs: number = this.getTimeout(timeout);
        try {
            const { payload } = (await pEvent(this, eventName, {
                rejectionEvents: [],
                timeout: timeoutMs,
                signal: abortSignal
            })) as i.EventMessage;
            return payload;
        } catch (err) {
            return undefined;
        }
    }
}
