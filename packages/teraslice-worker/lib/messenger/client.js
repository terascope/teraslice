'use strict';

const isEmpty = require('lodash/isEmpty');
const isString = require('lodash/isString');
const SocketIOClient = require('socket.io-client');
const MessengerCore = require('./core');

class MessengerClient extends MessengerCore {
    constructor(opts) {
        super(opts, 'client');
        const {
            hostUrl,
            socketOptions: _socketOptions,
        } = opts;

        if (!isString(hostUrl)) {
            throw new Error('MessengerClient requires a valid hostUrl');
        }

        if (isEmpty(_socketOptions)) {
            throw new Error('MessengerClient requires a valid socketOptions');
        }

        const socketOptions = Object.assign({}, _socketOptions, { forceNew: true });

        this.socket = new SocketIOClient(hostUrl, socketOptions);
    }

    shutdown() {
        if (this.socket.connected) {
            this.socket.close();
        }
        this.close();
    }

    connect() {
        const { socket } = this;
        if (socket.connected) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            let connectErr;
            let connectInterval;

            function _cleanup() {
                clearInterval(connectInterval);
                socket.removeListener('connect', connect);
                socket.removeListener('connect_error', connectError);
                socket.removeListener('connect_timeout', connectError);
            }

            function connect() {
                _cleanup();
                resolve();
            }

            function connectError(err) {
                connectErr = err;
            }

            socket.on('connect', connect);
            socket.on('connect_error', connectError);
            socket.on('connect_timeout', connectError);

            socket.connect();

            connectInterval = setInterval(() => {
                _cleanup();
                reject(connectErr);
            }, this.actionTimeout).unref();
        });
    }

    forceReconnect() {
        return new Promise((resolve) => {
            this.socket.io.once('reconnect', () => {
                resolve();
            });
            this.socket.io.engine.close();
        });
    }
}

module.exports = MessengerClient;
