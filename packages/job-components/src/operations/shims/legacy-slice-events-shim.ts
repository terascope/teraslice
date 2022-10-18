import { EventEmitter } from 'events';
import { WorkerOperationLifeCycle } from '../../interfaces/index.js';

interface SliceOperation extends WorkerOperationLifeCycle {
    readonly events: EventEmitter;
    shutdown(): Promise<void>;
}

export default function legacySliceEventsShim(op: SliceOperation): void {
    op.events.once('worker:shutdown', async () => {
        await op.shutdown();
    });

    op.events.on('slice:initialize', async (slice) => {
        if (op.onSliceInitialized != null) {
            await op.onSliceInitialized(slice.slice_id);
        }
    });

    op.events.on('slice:retry', async (slice) => {
        if (op.onSliceRetry != null) {
            await op.onSliceRetry(slice.slice_id);
        }
    });

    op.events.on('slice:failure', async (slice) => {
        if (op.onSliceFailed != null) {
            await op.onSliceFailed(slice.slice_id);
        }
    });

    op.events.on('slice:success', async (slice) => {
        if (op.onSliceFinalizing != null) {
            await op.onSliceFinalizing(slice.slice_id);
        }
    });

    op.events.on('slice:finalize', async (slice) => {
        if (op.onSliceFinished != null) {
            await op.onSliceFinished(slice.slice_id);
        }
    });
}
