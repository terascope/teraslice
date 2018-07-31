'use strict';

const _ = require('lodash');
const { EventEmitter } = require('events');
const newId = require('../utils/new-id');

class MessengerCore extends EventEmitter {
    constructor(opts, type) {
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
        this.type = type;
    }

    close() {
        this.closed = true;
        this.removeAllListeners();
    }

    send(msg) {
        const message = this._buildMessage(msg);

        return this._sendMessage(message);
    }

    async sendWithResponse(msg, { timeoutMs, retry } = {}) {
        const msgId = msg.__msgId || newId();

        const message = this._buildMessage(msg, {
            __msgId: msgId,
            response: true,
        });

        let shouldRetry = false;

        const _onReconnect = async () => {
            const retryMsg = _.cloneDeep(message);
            shouldRetry = true;
            _.set(retryMsg, 'payload.retry', true);
            await this._sendMessage(retryMsg);
        };

        const _waitForResponse = async () => {
            const response = await this.onceWithTimeout(msgId, timeoutMs, true);
            if (response == null) {
                if (shouldRetry) {
                    shouldRetry = false;
                    return _waitForResponse();
                }

                if (this.closed) return null;

                throw new Error(`Timeout error while communicating with ${message.address}, with message: ${JSON.stringify(message)}`);
            }

            if (response.error) {
                throw new Error(response.error);
            }

            return response.payload;
        };

        await this._sendMessage(message);

        if (retry && this.type === 'client') {
            this.socket.on('reconnect', _onReconnect);
        }

        let response;

        try {
            response = await _waitForResponse();
        } finally {
            if (retry && this.type === 'client') {
                this.socket.removeListener('reconnect', _onReconnect);
            }
        }

        return response;
    }

    respond(incoming, outgoing = {}) {
        const response = _.cloneDeep(outgoing);
        if (incoming.__msgId) {
            response.__msgId = incoming.__msgId;
        }
        response.__source = incoming.__source;
        response.message = 'messaging:response';
        response.to = incoming.__source;
        return this._sendMessage(response, incoming.__source);
    }

    async onceWithTimeout(eventName, timeout, skipError) {
        const timeoutMs = this._getTimeout(timeout);

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.removeListener(eventName, _onceWithTimeout);
                if (skipError) {
                    resolve();
                    return;
                }
                const error = new Error(`Timed out after ${timeoutMs}ms, waiting for event "${eventName}"`);
                error.code = 408;
                reject(error);
            }, timeoutMs);

            function _onceWithTimeout(msg) {
                clearTimeout(timer);
                resolve(msg);
            }

            this.once(eventName, _onceWithTimeout);
        });
    }

    handleResponses(socket) {
        const emitResponse = (msg) => {
            /* istanbul ignore if */
            if (!msg.__msgId) {
                console.error('Messaging response requires an a msgId') // eslint-disable-line
                return;
            }
            this.emit(msg.__msgId, msg);
        };

        socket.on('messaging:response', emitResponse);

        if (this.to === 'cluster_master') {
            socket.on('networkMessage', (msg) => {
                if (msg.message === 'messaging:response') {
                    emitResponse(msg);
                    return;
                }
                this.emit(msg.message, msg);
            });
        }
    }

    _sendMessage(message, override) {
        if (this.type === 'server') {
            const room = override || message.address;
            // this is madness but we it needs to be backwards compatible (for now)
            const event = this.source === 'cluster_master' ? 'networkMessage' : message.message;
            this.server.sockets.in(room).emit(event, message);
        }

        if (this.type === 'client') {
            this.socket.emit(message.message, message);
        }
    }

    // do this to make it easier to listen for a specific messages
    _emit(eventName, msg, keys = []) {
        _.forEach(_.compact(keys), (key) => {
            this.emit(`${eventName}:${key}`, msg);
        });

        this.emit(`${eventName}`, msg);
    }

    _getTimeout(timeout) {
        return (timeout || this.actionTimeout) + this.networkLatencyBuffer;
    }

    _buildMessage(msg, override) {
        return Object.assign({
            __source: this.source,
            to: this.to,
        }, msg, override);
    }
}

module.exports = MessengerCore;
