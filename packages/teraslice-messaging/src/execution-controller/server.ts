import { isNumber, get, Queue } from '@terascope/core-utils';
import {
    EnqueuedWorker, Slice, SliceCompletePayload, SliceTraceResults
} from '@terascope/types';
import type { Socket } from 'socket.io';
import * as core from '../messenger/index.js';
import * as i from './interfaces.js';

const { Available, Unavailable } = core.ClientState;

export class Server extends core.Server {
    private _activeWorkers: i.ActiveWorkers;
    queue: Queue<EnqueuedWorker>;
    executionReady: boolean;

    constructor(opts: i.ServerOptions) {
        const {
            port, actionTimeout, networkLatencyBuffer,
            workerDisconnectTimeout, logger, requestListener
        } = opts;

        if (!isNumber(workerDisconnectTimeout)) {
            throw new Error('ExecutionController.Server requires a valid workerDisconnectTimeout');
        }

        super({
            port,
            actionTimeout,
            requestListener,
            networkLatencyBuffer,
            clientDisconnectTimeout: workerDisconnectTimeout,
            serverName: 'ExecutionController',
            logger
        });

        this.queue = new Queue();
        this._activeWorkers = {};
        this.executionReady = false;
    }

    async start(): Promise<void> {
        this.on('connection', (msg) => {
            this.onConnection(
                msg.scope,
                msg.payload as Socket<core.ClientToServerEvents, core.ServerToClientEvents>
            );
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

    async shutdown(): Promise<void> {
        this.queue.each((worker: i.Worker) => {
            this.queue.remove(worker.workerId, 'workerId');
        });

        this._activeWorkers = {};

        await super.shutdown();
    }

    dequeueWorker(slice: Slice): string | null {
        const requestedWorkerId = slice.request.request_worker;
        return this._workerDequeue(requestedWorkerId);
    }

    async dispatchSlice(slice: Slice, workerId: string): Promise<boolean> {
        const isAvailable = this._clients[workerId] && this._clients[workerId].state === Available;

        if (!isAvailable) {
            this.logger.warn(`worker ${workerId} is not available`);
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
            this.logger.warn(error, `error when dispatching slice ${slice.slice_id}`);
        }

        if (!dispatched) {
            this.logger.warn(`failure to dispatch slice ${slice.slice_id} to worker ${workerId}`);
            this._activeWorkers[workerId] = false;
        } else {
            process.nextTick(() => {
                this.updateClientState(workerId, Unavailable);
            });
        }

        return dispatched;
    }

    async sendSliceTraceRequest(
        size: number,
        sendTimeout: number,
        traceTimeout: number
    ): Promise<SliceTraceResults> {
        const targetId = this._selectWorker();

        this.logger.debug('slice trace request sent to worker: ', targetId);

        const message = await this.send(
            targetId,
            'execution:slice:trace',
            { size, traceTimeout },
            { response: true, timeout: sendTimeout }
        );

        if (!message) {
            throw new Error(`Cannot complete the slice trace for worker ${targetId}, the execution controller is finished or shutting down`);
        }

        const { sliceId, records } = message.payload;

        return {
            workerId: targetId,
            sliceId,
            records
        };
    }

    onSliceSuccess(fn: (workerId: string, payload: SliceCompletePayload) => void): void {
        this.on('slice:success', (msg) => {
            fn(msg.scope, msg.payload);
        });
    }

    onSliceFailure(fn: (workerId: string, payload: SliceCompletePayload) => void): void {
        this.on('slice:failure', (msg) => {
            fn(msg.scope, msg.payload);
        });
    }

    sendExecutionFinishedToAll(exId: string): Promise<(core.Message | null)[]> {
        return this.sendToAll(
            'execution:finished',
            { exId },
            {
                response: false,
                volatile: false,
            }
        );
    }

    get activeWorkerCount(): number {
        return Object.values(this._activeWorkers).filter((v) => v).length;
    }

    get workerQueueSize(): number {
        return this.queue.size();
    }

    private onConnection(
        workerId: string,
        socket: Socket<core.ClientToServerEvents, core.ServerToClientEvents>
    ) {
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

    /**
     * Select a random worker from availableClients, or
     * onlineClients if none are currently available.
     */
    private _selectWorker(): string {
        // FixMe: It may be faster to wait for the next available client
        // instead of choosing a random online client.
        // If 2 API calls come in should we be tracking the size
        // and if equal returning the result to both?
        // We should at least track which workers are doing a trace and exclude them from the list.
        const pool = this.availableClients.length ? this.availableClients : this.onlineClients;

        if (!pool.length) {
            throw new Error('No workers are connected to this execution');
        }

        return pool[Math.floor(Math.random() * pool.length)].clientId;
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
        let workerId: string | null;

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
