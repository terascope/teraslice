import _ from 'lodash';
import Queue from '@terascope/queue';
import { Slice } from '@terascope/teraslice-types';
import NodeCache from 'node-cache';
import * as core from '../messenger';
import * as i from './interfaces';

export class Server extends core.Server {
    private cache: NodeCache;
    queue: Queue;
    private _activeWorkers: string[];

    constructor(opts: i.ServerOptions) {
        const {
            port,
            actionTimeout,
            pingInterval,
            pingTimeout,
            networkLatencyBuffer,
            workerDisconnectTimeout,
        } = opts;

        if (!_.isNumber(workerDisconnectTimeout)) {
            throw new Error('ExecutionController.Server requires a valid workerDisconnectTimeout');
        }

        super({
            port,
            actionTimeout,
            pingInterval,
            pingTimeout,
            networkLatencyBuffer,
            clientDisconnectTimeout: workerDisconnectTimeout,
            serverName: 'ExecutionController',
        });

        this.cache = new NodeCache({
            stdTTL: 30 * 60 * 1000, // 30 minutes
            checkperiod: 10 * 60 * 1000, // 10 minutes
            useClones: false,
        });

        this.queue = new Queue();
        this._activeWorkers = [];
    }

    async start() {
        this.on('connection', (clientId: string, socket: SocketIO.Socket) => {
            this.onConnection(clientId, socket);
        });

        this.onClientUnavailable((workerId) => {
            this._workerRemove(workerId);
        });

        this.onClientDisconnect((workerId) => {
            _.pull(this._activeWorkers, workerId);
            this._workerRemove(workerId);
        });

        this.onClientAvailable((workerId) => {
            this._workerEnqueue(workerId);
        });

        await this.listen();
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
            return {
                dispatched: false,
                workerId: null,
            };
        }

        const response = await this.send(workerId, 'execution:slice:new', slice);

        this._activeWorkers = _.union(this._activeWorkers, [workerId]);

        const dispatched = _.get(response, 'payload.willProcess', false);

        return {
            dispatched,
            workerId,
        };
    }

    onSliceSuccess(fn: core.ClientEventFn) {
        this.on('slice:success', fn);
    }

    onSliceFailure(fn: core.ClientEventFn) {
        this.on('slice:failure', fn);
    }

    get activeWorkers(): string[] {
        return this._activeWorkers;
    }

    get activeWorkerCount(): number {
        return _.size(this._activeWorkers);
    }

    broadcastExecutionFinished(exId: string) {
        return this.broadcast('execution:finished', { exId });
    }

    private onConnection(workerId: string, socket: SocketIO.Socket) {
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

            if (workerResponse.isShuttingDown) {
                socket.disconnect();
            }

            return {
                duplicate: alreadyCompleted,
                recorded: true,
                slice_id: sliceId,
            };
        }));
    }

    private _workerEnqueue(workerId: string): boolean {
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

    private _workerDequeue(requestedWorkerId?: string): string | null {
        let workerId: string|null;

        if (requestedWorkerId) {
            const worker = this.queue.extract('workerId', requestedWorkerId);
            workerId = worker ? worker.workerId : null;
        } else {
            const worker = this.queue.dequeue();
            workerId = worker ? worker.workerId : null;
        }

        if (workerId != null) {
            this.emit('worker:dequeue', workerId);
        }

        return workerId;
    }

    private _workerRemove(workerId: string): boolean {
        if (!workerId) return false;

        this.queue.remove(workerId, 'workerId');

        this.emit('worker:dequeue', workerId);
        return true;
    }
}
