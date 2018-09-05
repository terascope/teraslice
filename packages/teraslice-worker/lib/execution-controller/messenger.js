'use strict';

const _ = require('lodash');
const Queue = require('@terascope/queue');
const NodeCache = require('node-cache');
const { getWorkerId } = require('../utils');
const MessengerServer = require('../messenger/server');

class ExecutionControllerMessenger extends MessengerServer {
    constructor(opts = {}) {
        const {
            port,
            actionTimeout,
            networkLatencyBuffer,
            workerDisconnectTimeout
        } = opts;

        super({
            port,
            actionTimeout,
            networkLatencyBuffer,
            source: 'execution_controller',
            to: 'worker'
        });

        this.workerDisconnectTimeout = workerDisconnectTimeout;
        this.events = opts.events;
        this.cache = new NodeCache({
            stdTTL: 30 * 60 * 1000, // 30 minutes
            checkperiod: 10 * 60 * 1000, // 10 minutes
            useClones: false,
        });
        this.queue = new Queue();
        this._workers = {};

        this._onConnection = this._onConnection.bind(this);
    }

    async start() {
        await this.listen();

        this.server.use((socket, next) => {
            const {
                worker_id: workerId
            } = socket.handshake.query;

            socket.workerId = workerId;
            socket.join(workerId, next);
        });

        this.server.on('connection', this._onConnection);
    }

    async shutdown() {
        this.queue.each((worker) => {
            this.queue.remove(worker.worker_id, 'worker_id');
        });

        this.cache.flushAll();
        this.cache.close();
        await super.shutdown();
    }

    async sendNewSlice(workerId, slice, timeoutMs) {
        const msg = await this.sendWithResponse({
            address: workerId,
            message: 'slicer:slice:new',
            payload: slice,
        }, { timeoutMs });

        if (!msg.willProcess) {
            throw new Error(`Worker ${workerId} will not process new slice`);
        }

        return msg;
    }

    async dispatchSlice(slice, timeoutMs) {
        const requestedWorkerId = slice.request.request_worker;
        const workerId = this._workerDequeue(requestedWorkerId);
        if (!workerId) {
            throw new Error('No available workers to dispatch slice to');
        }

        const response = await this.sendWithResponse({
            address: workerId,
            message: 'slicer:slice:new',
            payload: slice
        }, { timeoutMs });

        const dispatched = response && response.willProcess;

        if (dispatched) {
            this._workers[workerId] = {
                status: 'active',
                workerId,
            };
        }

        return {
            dispatched,
            workerId,
        };
    }

    get activeWorkers() {
        return _.filter(this._workers, { status: 'active' }).length;
    }

    get availableWorkers() {
        return this.queue.size();
    }

    get connectedWorkers() {
        return _.filter(this._workers, (worker) => {
            if (worker.isShuttingDown) return true;
            if (worker.status === 'disconnected') {
                // make sure the worker is not disconnecting
                return worker.disconnectAt > Date.now();
            }
            return true;
        }).length;
    }

    get idleWorkers() {
        return _.filter(this._workers, { status: 'idle' }).length;
    }

    get readyWorkers() {
        return _.filter(this._workers, { status: 'ready' }).length;
    }

    executionFinished(exId) {
        return this.server.sockets.emit('execution:finished', { ex_id: exId });
    }

    _onConnection(socket) {
        const { workerId } = socket;

        this._workers[workerId] = {
            status: 'connected',
            workerId,
        };

        socket.on('error', (err) => {
            this._emit('worker:error', err, [workerId]);
        });

        socket.on('disconnect', (err) => {
            this._workerRemove(workerId);

            this._emit('worker:disconnect', err, [workerId]);
            this.emit('worker:offline');
            const lastStatus = _.get(this._workers, [workerId, 'status']);
            const disconnectAt = Date.now() + this.workerDisconnectTimeout;
            this._workers[workerId] = {
                workerId,
                disconnectAt,
                lastStatus,
                status: 'disconnected',
            };
        });

        socket.on('reconnect', () => {
            this._workers[workerId] = {
                status: 'reconnected',
                workerId
            };
        });

        socket.on('worker:ready', (msg) => {
            this._workerEnqueue(msg);
            this._workers[workerId] = {
                status: 'ready',
                workerId
            };
        });

        this.handleResponses(socket);
        this.emit('worker:online');

        socket.on('worker:slice:complete', (msg) => {
            const workerResponse = msg.payload;
            const sliceId = _.get(workerResponse, 'slice.slice_id');

            if (workerResponse.retry && !workerResponse.isShuttingDown) {
                const retried = this.cache.get(`${sliceId}:retry`);
                if (!retried) {
                    this._workers[workerId] = {
                        status: 'reconnected',
                        workerId
                    };
                    this.cache.set(`${sliceId}:retry`, true);
                    this.emit('worker:reconnect', workerResponse);
                }
            }
            
            if (workerResponse.isShuttingDown) {
                this._workers[workerId].isShuttingDown = true;
            }

            const alreadyCompleted = this.cache.get(`${sliceId}:complete`);

            if (!alreadyCompleted) {
                this._workers[workerId] = {
                    status: 'idle',
                    workerId
                };
                this.cache.set(`${sliceId}:complete`, true);

                if (workerResponse.error) {
                    this.events.emit('slice:failure', workerResponse);
                } else {
                    this.events.emit('slice:success', workerResponse);
                }
            }

            this.respond(msg, {
                payload: {
                    recorded: true,
                    slice_id: sliceId,
                }
            });
        });
    }

    _workerEnqueue(arg) {
        const workerId = getWorkerId(arg);
        if (!workerId) {
            throw new Error('Failed to enqueue invalid worker');
        }

        const exists = this.queue.exists('worker_id', workerId);
        if (!exists) {
            this.queue.enqueue({ worker_id: workerId });
        }

        this._emit('worker:enqueue', { worker_id: workerId }, [workerId]);
        return exists;
    }

    _workerDequeue(arg) {
        let workerId;
        if (arg) {
            const worker = this.queue.extract('worker_id', getWorkerId(arg));
            if (worker) workerId = worker.worker_id;
        }

        if (!workerId) {
            const worker = this.queue.dequeue();
            if (worker) workerId = worker.worker_id;
        }

        if (!workerId) {
            return null;
        }

        this._emit('worker:dequeue', { worker_id: workerId }, [workerId]);
        return workerId;
    }

    _workerRemove(arg) {
        const workerId = getWorkerId(arg);
        if (!workerId) return false;

        this.queue.remove(workerId, 'worker_id');

        this._emit('worker:dequeue', { worker_id: workerId }, [workerId]);
        this._emit('worker:remove', { worker_id: workerId }, [workerId]);
        return true;
    }
}

module.exports = ExecutionControllerMessenger;
