'use strict';

const isString = require('lodash/isString');
const pickBy = require('lodash/pickBy');
const WrapError = require('../utils/wrap-error');
const MessengerClient = require('../messenger/client');

class WorkerMessenger extends MessengerClient {
    constructor(opts = {}) {
        const {
            executionControllerUrl,
            socketOptions: _socketOptions,
            workerId,
            networkLatencyBuffer,
            actionTimeout,
        } = opts;

        if (!isString(executionControllerUrl)) {
            throw new Error('WorkerMessenger requires a valid executionControllerUrl');
        }

        if (!isString(workerId)) {
            throw new Error('WorkerMessenger requires a valid workerId');
        }

        const socketOptions = Object.assign({
            autoConnect: false,
            query: {
                worker_id: workerId,
            }
        }, _socketOptions);

        super({
            hostUrl: executionControllerUrl,
            socketOptions,
            networkLatencyBuffer,
            actionTimeout,
            source: workerId,
            to: 'execution_controller'
        });

        this.workerId = workerId;
        this.available = false;
    }

    async start() {
        try {
            await this.connect();
        } catch (err) {
            throw new WrapError('Unable to connect to execution controller', err);
        }

        this.socket.on('slicer:slice:new', (msg) => {
            this.respond(msg, {
                payload: {
                    willProcess: this.available
                },
            });
            if (this.available) {
                this.emit('slicer:slice:new', msg.payload);
            }
        });

        this.socket.on('execution:finished', (msg) => {
            this.emit('worker:shutdown', msg);
        });

        this.handleResponses(this.socket);
    }

    async ready() {
        return this.send({
            message: 'worker:ready',
            payload: {
                worker_id: this.workerId
            }
        });
    }

    sliceComplete(input) {
        const payload = pickBy(Object.assign({
            worker_id: this.workerId
        }, input));

        return this.sendWithResponse({
            message: 'worker:slice:complete',
            payload
        }, {
            retry: true
        });
    }

    async waitForSlice(fn = () => {}, interval = 100) {
        this.ready();
        this.available = true;

        const slice = await new Promise((resolve) => {
            const intervalId = setInterval(() => {
                if (this.closed || fn()) {
                    this.removeListener('slicer:slice:new', onMessage);
                    resolve();
                }
            }, interval);
            function onMessage(msg) {
                clearInterval(intervalId);
                resolve(msg);
                this.available = false;
            }
            this.once('slicer:slice:new', onMessage);
        });

        this.available = false;

        return slice;
    }
}

module.exports = WorkerMessenger;
