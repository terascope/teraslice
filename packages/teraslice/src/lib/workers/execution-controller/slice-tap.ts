import type { Logger } from '@terascope/core-utils';
import type { ExecutionController } from '@terascope/teraslice-messaging';
import type { SliceTapRequest, SliceTapResults } from '@terascope/types';

// the least time worth giving a worker to tap a slice
// after waiting for it to become available
const MIN_TAP_TIMEOUT = 1000;

export type SliceTapServer = Pick<
    ExecutionController.Server,
    'queue' | 'closed' | 'isShuttingDown' | 'onWorkerEnqueue' | 'sendSliceTapRequest'
>;

interface PendingTap {
    claim: (workerId: string) => void;
    fail: (err: Error) => void;
}

/**
 * Picks which worker should handle a slice tap request and sends it.
 *
 * A tap targets the queued worker closest to the head (the next to receive
 * a slice). Tapping does not hold a worker back from being dispatched a
 * slice, it only keeps two tap requests from targeting the same worker at once.
 */
export class SliceTap {
    private server: SliceTapServer;
    private logger: Logger;
    private tappingWorkers = new Set<string>();
    private pendingTaps: PendingTap[] = [];

    constructor(server: SliceTapServer, logger: Logger) {
        this.server = server;
        this.logger = logger;

        // The claim must happen synchronously in the enqueue event so the
        // tap request is sent before the worker can be dequeued and
        // dispatched a slice
        this.server.onWorkerEnqueue((workerId) => this._offerWorker(workerId));
    }

    /**
     * Send a slice tap request to the next worker in line for a slice,
     * waiting for one to be enqueued if necessary.
     */
    async tap({ size, sendTimeout, tapTimeout }: SliceTapRequest): Promise<SliceTapResults> {
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

            const message = await this.server.sendSliceTapRequest(
                targetId,
                { size, tapTimeout: remainingTapTimeout },
                sendTimeout - elapsed
            );

            if (!message) {
                throw new Error(`Cannot complete the slice tap for worker ${targetId}, the execution controller is finished or shutting down`);
            }

            const { sliceId, records } = message.payload;

            return {
                workerId: targetId,
                sliceId,
                records
            };
        } finally {
            if (targetId != null) this._releaseWorker(targetId);
        }
    }

    /**
     * Select the queued worker closest to the head that is
     * not already tapping, and mark it as tapping.
     */
    private _selectWorker(): string | undefined {
        let selected: string | undefined;

        this.server.queue.each(({ workerId }) => {
            if (selected == null && !this.tappingWorkers.has(workerId)) {
                selected = workerId;
            }
        });

        if (selected != null) this.tappingWorkers.add(selected);

        return selected;
    }

    /**
     * Wait for a worker to be offered (enqueued or released) and claim it
     */
    private _waitForWorker(timeoutMs: number): Promise<string> {
        return new Promise((resolve, reject) => {
            let timer: NodeJS.Timeout | undefined = undefined;

            const pendingTap: PendingTap = {
                claim: (workerId) => {
                    clearTimeout(timer);
                    resolve(workerId);
                },
                fail: (err) => {
                    clearTimeout(timer);
                    reject(err);
                }
            };

            timer = setTimeout(() => {
                this.pendingTaps = this.pendingTaps.filter((p) => p !== pendingTap);
                reject(new Error(`Slice tap timeout, no worker became available within ${timeoutMs}ms`));
            }, timeoutMs);

            this.pendingTaps.push(pendingTap);
        });
    }

    /**
     * Hand a worker to the longest pending tap, if any
     */
    private _offerWorker(workerId: string): void {
        if (this.server.closed || this.server.isShuttingDown) {
            const err = new Error('Cannot complete the slice tap, the execution controller is finished or shutting down');
            this.pendingTaps.splice(0).forEach((pendingTap) => pendingTap.fail(err));
            return;
        }

        if (this.tappingWorkers.has(workerId)) return;

        const pendingTap = this.pendingTaps.shift();
        if (pendingTap == null) return;

        this.tappingWorkers.add(workerId);
        pendingTap.claim(workerId);
    }

    /**
     * Mark a worker as no longer tapping and, if it is
     * still queued, let any pending tap claim it.
     */
    private _releaseWorker(workerId: string): void {
        this.tappingWorkers.delete(workerId);

        if (this.server.queue.exists('workerId', workerId)) {
            this._offerWorker(workerId);
        }
    }
}
