import { isNumber, get, Queue } from '@terascope/core-utils';
import {
    EnqueuedWorker, Slice, SliceCompletePayload, SliceTapResults
} from '@terascope/types';
import type { Socket } from 'socket.io';
import * as core from '../messenger/index.js';
import * as i from './interfaces.js';

const { Available, Unavailable } = core.ClientState;

// the least time worth giving a worker to tap a slice
// after waiting for it to become available
const MIN_TAP_TIMEOUT = 1000;

export class Server extends core.Server {
    private _activeWorkers: i.ActiveWorkers;
    private _tappingWorkers = new Set<string>();
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

    /**
     * Send a slice tap request to the next worker in line for a slice,
     * waiting for one to be enqueued if necessary.
     */
    async sendSliceTapRequest(
        size: number,
        sendTimeout: number,
        tapTimeout: number
    ): Promise<SliceTapResults> {
        const start = Date.now();
        let targetId: string | undefined;

        try {
            targetId = this._selectWorker();

            if (targetId == null) {
                this.logger.debug('Slice tap: no worker is available, waiting for one to be enqueued');
                targetId = await this._waitForWorker(tapTimeout);
            }

            const elapsed = Date.now() - start;
            const remainingTapTimeout = tapTimeout - elapsed;

            if (remainingTapTimeout < MIN_TAP_TIMEOUT) {
                throw new Error(`Slice tap timeout after waiting ${elapsed}ms for a worker to become available`);
            }

            this.logger.debug(`Slice tap request sent to worker: ${targetId}`);

            const message = await this.send(
                targetId!,
                'worker:slice:tap',
                { size, tapTimeout: remainingTapTimeout },
                { response: true, timeout: sendTimeout - elapsed }
            );

            if (!message) {
                throw new Error(`Cannot complete the slice tap for worker ${targetId}, the execution controller is finished or shutting down`);
            }

            const { sliceId, records } = message.payload;

            return {
                workerId: targetId!,
                sliceId,
                records
            };
        } finally {
            if (targetId != null) this._releaseTappingWorker(targetId);
        }
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
     * Select the queued worker closest to the head (the next to receive
     * a slice) that is not already tapping, and mark it as tapping.
     */
    private _selectWorker(): string | undefined {
        let selected: string | undefined;

        this.queue.each(({ workerId }) => {
            if (selected == null && !this._tappingWorkers.has(workerId)) {
                selected = workerId;
            }
        });

        if (selected != null) this._tappingWorkers.add(selected);

        return selected;
    }

    /**
     * Wait for a worker to be enqueued and claim it for tapping. The claim
     * happens synchronously in the enqueue event so the tap request is
     * sent before the worker can be dequeued and dispatched a slice.
     */
    private _waitForWorker(timeoutMs: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const removeListeners = () => {
                this.removeListener('worker:enqueue', onEnqueue);
                this.removeListener('worker:tap:released', onEnqueue);
            };

            const timer = setTimeout(() => {
                removeListeners();
                reject(new Error(`Slice tap timeout, no worker became available within ${timeoutMs}ms`));
            }, timeoutMs);

            function onEnqueue(this: Server, { scope: workerId }: core.EventMessage) {
                if (this.closed || this.isShuttingDown) {
                    removeListeners();
                    clearTimeout(timer);
                    reject(new Error('Cannot complete the slice tap, the execution controller is finished or shutting down'));
                    return;
                }

                if (this._tappingWorkers.has(workerId)) return;

                this._tappingWorkers.add(workerId);
                removeListeners();
                clearTimeout(timer);
                resolve(workerId);
            }

            this.on('worker:enqueue', onEnqueue);
            this.on('worker:tap:released', onEnqueue);
        });
    }

    /**
     * Mark a worker as no longer tapping and, if it is still queued (like
     * after a tap timeout), let any waiting tap request claim it.
     */
    private _releaseTappingWorker(workerId: string): void {
        this._tappingWorkers.delete(workerId);

        if (this.queue.exists('workerId', workerId)) {
            this.emit('worker:tap:released', { scope: workerId, payload: {} });
        }
    }

    private _workerEnqueue(workerId: string): boolean {
        if (!workerId) {
            throw new Error('Failed to enqueue invalid worker');
        }

        const exists = this.queue.exists('workerId', workerId);
        if (!exists) {
            this.queue.enqueue({ workerId });
        }

        this.emit('worker:enqueue', { scope: workerId, payload: {} });
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
