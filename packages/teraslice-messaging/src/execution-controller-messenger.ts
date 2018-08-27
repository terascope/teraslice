import _ from 'lodash';
import Queue from '@terascope/queue';
import { Slice } from '@terascope/teraslice-types';
import NodeCache from 'node-cache';
import * as m from './messenger/interfaces';
import { getWorkerId } from './utils';
import { MessengerServer } from './messenger/server';

interface Worker {
    worker_id: string;
}

export interface ExecutionControllerMessengerOptions {
    port: number;
    controllerId: string;
    networkLatencyBuffer?: number;
    actionTimeout: number;
}

export class ExecutionControllerMessenger extends MessengerServer {
    cache: NodeCache;
    queue: Queue;

    constructor(opts: ExecutionControllerMessengerOptions) {
        const {
            port,
            actionTimeout,
            networkLatencyBuffer
        } = opts;

        super({
            port,
            actionTimeout,
            networkLatencyBuffer,
            source: 'execution_controller',
            to: 'worker'
        });

        this.cache = new NodeCache({
            stdTTL: 30 * 60 * 1000, // 30 minutes
            checkperiod: 10 * 60 * 1000, // 10 minutes
            useClones: false,
        });

        this.queue = new Queue();

        this._onConnection = this._onConnection.bind(this);
    }

    async start() {
        await this.listen();

        this.server.use((socket, next) => {
            const {
                worker_id: workerId
            } = socket.handshake.query;

            // @ts-ignore
            socket.workerId = workerId;
            socket.join(workerId, next);
        });

        this.server.on('connection', this._onConnection);
    }

    async shutdown() {
        this.queue.each((worker: Worker) => {
            this.queue.remove(worker.worker_id, 'worker_id');
        });

        this.cache.flushAll();
        this.cache.close();

        await super.shutdown();
    }

    async sendNewSlice(workerId: string, slice: object, timeoutMs?: number) {
        const msg = await this.sendWithResponse({
            address: workerId,
            message: 'slicer:slice:new',
            payload: slice,
        }, { timeoutMs }) as m.SliceResponseMessage;

        if (!msg.willProcess) {
            throw new Error(`Worker ${workerId} will not process new slice`);
        }

        return msg;
    }

    async dispatchSlice(slice: Slice, timeoutMs?: number) {
        const requestedWorkerId = slice.request.request_worker;
        const workerId = this._workerDequeue(requestedWorkerId);
        if (!workerId) {
            throw new Error('No available workers to dispatch slice to');
        }

        const response = await this.sendWithResponse({
            address: workerId,
            message: 'slicer:slice:new',
            payload: slice
        }, { timeoutMs }) as m.SliceResponseMessage;

        const dispatched = response && response.willProcess;

        return {
            dispatched,
            workerId,
        };
    }

    availableWorkers() {
        return this.queue.size();
    }

    activeWorkers() {
        return this.connectedWorkers() - this.availableWorkers();
    }

    connectedWorkers() {
        return _.get(this.server, 'eio.clientsCount', 0);
    }

    executionFinished(exId: string) {
        return this.server.sockets.emit('execution:finished', { ex_id: exId });
    }

    private _onConnection(socket: SocketIO.Socket) {
        // @ts-ignore
        const { workerId } = socket;

        socket.on('error', (err) => {
            this._emit('worker:error', err, [workerId]);
        });

        socket.on('disconnect', (err) => {
            this._workerRemove(workerId);

            this._emit('worker:disconnect', err, [workerId]);
            this.emit('worker:offline');
        });

        socket.on('worker:ready', (msg) => {
            this._workerEnqueue(msg);
        });

        this.handleResponses(socket);
        this.emit('worker:online');

        socket.on('worker:slice:complete', (msg) => {
            const workerResponse = msg.payload;
            const sliceId = _.get(workerResponse, 'slice.slice_id');
            if (workerResponse.retry) {
                const retried = this.cache.get(`${sliceId}:retry`);
                if (!retried) {
                    this.cache.set(`${sliceId}:retry`, true);
                    this.emit('worker:reconnect', workerResponse);
                }
            }

            const alreadyCompleted = this.cache.get(`${sliceId}:complete`);

            if (!alreadyCompleted) {
                this.cache.set(`${sliceId}:complete`, true);

                if (workerResponse.error) {
                    this.emit('slice:failure', workerResponse);
                } else {
                    this.emit('slice:success', workerResponse);
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

    private _workerEnqueue(arg: string | object): boolean {
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

    private _workerDequeue(arg?: string | object): string|null {
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

    private _workerRemove(arg: string | object): boolean {
        const workerId = getWorkerId(arg);
        if (!workerId) return false;

        this.queue.remove(workerId, 'worker_id');

        this._emit('worker:dequeue', { worker_id: workerId }, [workerId]);
        this._emit('worker:remove', { worker_id: workerId }, [workerId]);
        return true;
    }
}
