import { cloneDeep, DataEntity, pWhile } from '@terascope/core-utils';
import { SliceTraceResults } from '@terascope/types';
import Observer from './observer.js';
import { PendingTrace } from './interfaces.js';

/**
 * An Observer for collecting a slice trace
 */
export default class TraceObserver extends Observer {
    private pending: PendingTrace | null = null;

    onSliceInitialized(sliceId: string): void {
        if (this.pending && this.pending.sliceId == null) {
            this.pending.sliceId = sliceId;
        }
    }

    onOperationComplete(
        sliceId: string, index: number, processed: number, records: DataEntity[]
    ): void {
        const { pending } = this;
        if (pending === null || pending?.sliceId !== sliceId) return;

        this.logger.debug(`Collecting trace: ${pending.size} of ${processed} records, operation ${index}, slice ${sliceId}.`);

        pending.records[index] = records
            .slice(0, pending.size)
            .map((record) => ({
                record: cloneDeep({ ...record }),
                metadata: cloneDeep(record.getMetadata())
            }));
    }

    onSliceFinalizing(sliceId: string): void {
        if (this.pending?.sliceId === sliceId) this.pending.done = true;
    }

    onSliceFailed(sliceId: string): void {
        if (this.pending?.sliceId === sliceId) {
            this.pending.failure = `slice ${sliceId} failed before completing`;
        }
    }

    /**
     * Send failure error if worker is shutting down. Shutdown should only
     * be called after the slice finishes, so this is just a precaution.
     */
    async shutdown(): Promise<void> {
        if (this.pending) {
            this.pending.failure = 'worker shut down before the slice completed';
        }

        await super.shutdown();
    }

    /**
     * Collect a trace from the next slice this worker starts.
     */
    async getTrace(size: number, timeoutMs: number): Promise<SliceTraceResults> {
        if (this.pending != null) {
            throw new Error('A slice trace is already in progress for this worker');
        }

        this.logger.debug('Slice trace initialized');

        const pending: PendingTrace = {
            size: size === 0 ? Number.POSITIVE_INFINITY : size, // 0 means all records
            sliceId: null,
            records: [],
            done: false,
            failure: null
        };

        this.pending = pending;

        try {
            await pWhile(async () => pending.done || pending.failure !== null, {
                timeoutMs,
                name: 'Slice trace',
                enabledJitter: true,
                minJitter: 100,
                error: 'no slice completed in time'
            });

            if (pending.failure !== null) {
                this.logger.debug(`Slice trace failed: ${pending.failure}`);
                throw new Error(pending.failure);
            }

            this.logger.debug('Slice trace complete');

            return {
                sliceId: pending.sliceId!,
                records: pending.records
            };
        } finally {
            this.pending = null;
        }
    }
}
