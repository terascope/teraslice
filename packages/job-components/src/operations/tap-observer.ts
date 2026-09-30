import { cloneDeep, DataEntity, pWhile } from '@terascope/core-utils';
import { SliceTapResults } from '@terascope/types';
import Observer from './observer.js';
import { PendingTap } from './interfaces.js';

/**
 * An Observer for collecting a slice tap
 */
export default class TapObserver extends Observer {
    private pending: PendingTap | null = null;

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

        this.logger.debug(`Slice tap: collecting ${pending.size} of ${processed} records, operation ${index}, slice ${sliceId}.`);

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
     * Collect a tap from the next slice this worker starts.
     */
    async getTap(size: number, timeoutMs: number): Promise<SliceTapResults> {
        if (this.pending != null) {
            throw new Error('A slice tap is already in progress for this worker');
        }

        this.logger.debug('Slice tap pending');

        const pending: PendingTap = {
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
                name: 'Slice tap',
                enabledJitter: true,
                minJitter: 100,
                error: 'no slice completed in time'
            });

            if (pending.failure !== null) {
                this.logger.debug(`Slice tap failed: ${pending.failure}`);
                throw new Error(pending.failure);
            }

            this.logger.debug('Slice tap complete');

            return {
                sliceId: pending.sliceId!,
                records: pending.records
            };
        } finally {
            this.pending = null;
        }
    }
}
