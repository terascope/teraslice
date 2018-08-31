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
            networkLatencyBuffer,
            workerDisconnectTimeout,
        } = opts;

        if (!_.isNumber(workerDisconnectTimeout)) {
            throw new Error('ExecutionController.Server requires a valid workerDisconnectTimeout');
        }

        super({
            port,
            actionTimeout,
            networkLatencyBuffer,
            pingTimeout: workerDisconnectTimeout,
            serverName: 'ExecutionController',
        });

        this.cache = new NodeCache({
            stdTTL: 30 * 60 * 1000, // 30 minutes
            checkperiod: 10 * 60 * 1000, // 10 minutes
            useClones: false,
        });

        this.queue = new Queue();
        this.onConnection = this.onConnection.bind(this);
    }

    async start() {
        await this.listen();

        this.server.on('connection', this.onConnection);
    }

    async shutdown() {
        this.queue.each((worker: i.Worker) => {
            this.queue.remove(worker.workerId, 'workerId');
        });

        this.cache.flushAll();
        this.cache.close();

        await super.shutdown();
    }

    async dispatchSlice(slice: Slice): Promise<i.DispatchSliceResult> {
        const requestedWorkerId = slice.request.request_worker;
        const workerId = this._workerDequeue(requestedWorkerId);
        if (!workerId) {
            throw new Error('No available workers to dispatch slice to');
        }

        const response = await this.send(workerId, 'execution:slice:new', slice);

        const dispatched = _.get(response, 'payload.willProcess', false);

        return {
            dispatched,
            workerId,
        };
    }

    get availableWorkers(): number {
        return this.queue.size();
    }

    get activeWorkers(): number {
        return this.onlineClientCount - this.unavailableClientCount;
    }

    sendExecutionFinished(exId: string) {
        return this.broadcast('execution:finished', { exId });
    }

    private onConnection(socket: SocketIO.Socket) {
        const workerId = this.getClientId(socket);

        this.on('client:offline', () => {
            this._workerRemove(workerId);
        });

        this.on('client:available', (msg) => {
            this._workerEnqueue(msg);
        });

        socket.on('worker:slice:complete', this.handleResponse((msg) => {
            const workerResponse = msg.payload;
            const sliceId = _.get(workerResponse, 'slice.slice_id');
            const alreadyCompleted = this.cache.get(`${sliceId}:complete`);

            if (!alreadyCompleted) {
                this.cache.set(`${sliceId}:complete`, true);

                if (workerResponse.error) {
                    this.emit('slice:failure', workerId, workerResponse);
                } else {
                    this.emit('slice:success', workerId, workerResponse);
                }
            }

            return {
                recorded: true,
                slice_id: sliceId,
            };
        }));
    }

    private _workerEnqueue(arg: string | object): boolean {
        const workerId = getWorkerId(arg);
        if (!workerId) {
            throw new Error('Failed to enqueue invalid worker');
        }

        const exists = this.queue.exists('workerId', workerId);
        if (!exists) {
            this.queue.enqueue({ workerId });
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
