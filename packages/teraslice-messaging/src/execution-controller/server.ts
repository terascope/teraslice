import { isNumber, get, debugLogger } from '@terascope/utils';
import Queue from '@terascope/queue';
import * as core from '../messenger';
import * as i from './interfaces';

const logger = debugLogger('teraslice-messaging:execution-controller:server');

const { Available, Unavailable } = core.ClientState;

export class Server extends core.Server {
    private _activeWorkers: i.ActiveWorkers;
    queue: Queue<i.EnqueuedWorker>;

    constructor(opts: i.ServerOptions) {
        const {
            port,
            actionTimeout,
            pingInterval,
            pingTimeout,
            networkLatencyBuffer,
            workerDisconnectTimeout,
        } = opts;

        if (!isNumber(workerDisconnectTimeout)) {
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

        this.queue = new Queue();
        this._activeWorkers = {};
    }

    async start() {
        this.on('connection', (msg) => {
            this.onConnection(msg.scope, msg.payload as SocketIO.Socket);
        });

        this.onClientUnavailable((workerId) => {
            this._workerRemove(workerId);
        });

        this.onClientDisconnect((workerId) => {
            delete this._activeWorkers[workerId];
            this._workerRemove(workerId);
        });

        this.onClientAvailable((workerId) => {
            this._activeWorkers[workerId] = false;
            this._workerEnqueue(workerId);
        });

        await this.listen();
    }

    async shutdown() {
        this.queue.each((worker: i.Worker) => {
            this.queue.remove(worker.workerId, 'workerId');
        });

        this._activeWorkers = {};

        await super.shutdown();
    }

    dequeueWorker(slice: i.Slice): string|null {
        const requestedWorkerId = slice.request.request_worker;
        return this._workerDequeue(requestedWorkerId);
    }

    async dispatchSlice(slice: i.Slice, workerId: string): Promise<boolean> {
        const isAvailable = this._clients[workerId] && this._clients[workerId].state === Available;
        if (!isAvailable) {
            logger.warn(`worker ${workerId} is not available`);
            return false;
        }

        // first assume the slice is dispatched
        this._activeWorkers[workerId] = true;

        let dispatched = false;

        try {
            const response = await this.send(workerId, 'execution:slice:new', slice);
            if (response && response.payload) {
                dispatched = response.payload.willProcess;
            }
        } catch (error) {
            logger.warn(`got error when dispatching slice ${slice.slice_id}`, error);
        }

        if (!dispatched) {
            logger.warn(`failure to dispatch slice ${slice.slice_id} to worker ${workerId}`);
            this._activeWorkers[workerId] = false;
        } else {
            process.nextTick(() => {
                this.updateClientState(workerId, Unavailable);
            });
        }

        return dispatched;
    }

    onSliceSuccess(fn: (workerId: string, payload: i.SliceCompletePayload) => {}) {
        this.on('slice:success', (msg) => {
            fn(msg.scope, msg.payload);
        });
    }

    onSliceFailure(fn: (workerId: string, payload: i.SliceCompletePayload) => {}) {
        this.on('slice:failure', (msg) => {
            fn(msg.scope, msg.payload);
        });
    }

    sendExecutionFinishedToAll(exId: string) {
        return this.sendToAll('execution:finished', { exId }, {
            response: false,
            volatile: false,
        });
    }

    get activeWorkerCount(): number {
        return Object.values(this._activeWorkers).filter((v) => v).length;
    }

    get workerQueueSize(): number {
        return this.queue.size();
    }

    private onConnection(workerId: string, socket: SocketIO.Socket) {
        this.handleResponse(socket, 'worker:slice:complete', async (msg) => {
            const { payload } = msg;
            const sliceId = get(payload, 'slice.slice_id');

            if (payload.error) {
                this.emit('slice:failure', { scope: workerId, payload });
            } else {
                this.emit('slice:success', { scope: workerId, payload });
            }

            this._activeWorkers[workerId] = false;

            return {
                recorded: true,
                slice_id: sliceId,
            };
        });
    }

    private _workerEnqueue(workerId: string): boolean {
        if (!workerId) {
            throw new Error('Failed to enqueue invalid worker');
        }

        const exists = this.queue.exists('workerId', workerId);
        if (!exists) {
            this.queue.enqueue({ workerId });
        }

        this.emit('worker:enqueue', { scope: '', payload: {} });
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
            this._activeWorkers[workerId] = false;
        }

        return workerId;
    }

    private _workerRemove(workerId: string): boolean {
        if (!workerId) return false;

        this.queue.remove(workerId, 'workerId');

        return true;
    }
}
