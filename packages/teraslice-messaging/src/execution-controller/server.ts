import _ from 'lodash';
import Queue from '@terascope/queue';
import { Slice } from '@terascope/teraslice-types';
import NodeCache from 'node-cache';
import { getWorkerId } from '../utils';
import * as core from '../messenger';
import * as i from './interfaces';

export class Server extends core.Server {
    cache: NodeCache;
    queue: Queue;

    constructor(opts: i.ServerOptions) {
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
            const { workerId } = socket.handshake.query;

            // @ts-ignore
            socket.workerId = workerId;
            socket.join(workerId, next);
        });

        this.server.on('connection', this._onConnection);
    }

    async shutdown() {
        this.queue.each((worker: i.Worker) => {
            this.queue.remove(worker.workerId, 'workerId');
        });

        this.cache.flushAll();
        this.cache.close();

        await super.shutdown();
    }

    async sendNewSlice(workerId: string, slice: Slice, timeoutMs?: number): Promise<i.SliceResponseMessage> {
        const msg = await this.sendWithResponse({
            address: workerId,
            message: 'slicer:slice:new',
            payload: slice,
        }, { timeoutMs }) as i.SliceResponseMessage;

        if (!msg.willProcess) {
            throw new Error(`Worker ${workerId} will not process new slice`);
        }

        return msg;
    }

    async dispatchSlice(slice: Slice, timeoutMs?: number): Promise<i.DispatchSliceResult> {
        const requestedWorkerId = slice.request.request_worker;
        const workerId = this._workerDequeue(requestedWorkerId);
        if (!workerId) {
            throw new Error('No available workers to dispatch slice to');
        }

        const response = await this.sendWithResponse({
            address: workerId,
            message: 'slicer:slice:new',
            payload: slice
        }, { timeoutMs }) as i.SliceResponseMessage;

        const dispatched = _.get(response, 'willProcess') || false;

        return {
            dispatched,
            workerId,
        };
    }

    availableWorkers(): number {
        return this.queue.size();
    }

    activeWorkers(): number {
        return this.connectedWorkers() - this.availableWorkers();
    }

    connectedWorkers(): number {
        return _.get(this.server, 'eio.clientsCount', 0);
    }

    executionFinished(exId: string) {
        this.server.sockets.emit('execution:finished', { exId: exId });
    }

    onWorkerOffline(fn: i.WorkerErrorEventFn) {
        this.on('worker:offline', fn);
    }

    onWorkerOnline(fn: i.WorkerEventFn) {
        this.on('worker:online', fn);
    }

    onWorkerReconnect(fn: i.WorkerEventFn) {
        this.on('worker:reconnect', fn);
    }

    onWorkerReady(fn: i.WorkerEventFn) {
        this.on('worker:enqueue', fn);
    }

    onWorkerError(fn: i.WorkerErrorEventFn) {
        this.on('worker:error', fn);
    }

    private _onConnection(socket: SocketIO.Socket) {
        // @ts-ignore
        const { workerId } = socket;

        socket.on('error', (err) => {
            this.emit('worker:error', workerId, err);
        });

        socket.on('disconnect', (err) => {
            this._workerRemove(workerId);
            this.emit('worker:offline', workerId, err);
        });

        socket.on('worker:ready', (msg) => {
            this._workerEnqueue(msg);
        });

        this.emit('worker:online', workerId);

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

        const exists = this.queue.exists('workerId', workerId);
        if (!exists) {
            this.queue.enqueue({ workerId: workerId });
        }

        this.emit('worker:enqueue', workerId);
        return exists;
    }

    private _workerDequeue(arg?: string | object): string | null {
        let workerId;
        if (arg) {
            const worker = this.queue.extract('workerId', getWorkerId(arg));
            if (worker) workerId = worker.workerId;
        }

        if (!workerId) {
            const worker = this.queue.dequeue();
            if (worker) workerId = worker.workerId;
        }

        if (!workerId) {
            return null;
        }

        this.emit('worker:dequeue', workerId);
        return workerId;
    }

    private _workerRemove(arg: string | object): boolean {
        const workerId = getWorkerId(arg);
        if (!workerId) return false;

        this.queue.remove(workerId, 'workerId');

        this.emit('worker:dequeue', workerId);
        return true;
    }
}
