import { EventEmitter } from 'events';
import SliceEvents from '../core/slice-events';

interface SliceOperation extends SliceEvents {
    readonly events: EventEmitter;
    shutdown(): Promise<void>;
}

export default function legacySliceEventsShim(op: SliceOperation) {
    op.events.once('worker:shutdown', async () => {
        await op.shutdown();
    });

    op.events.on('slice:initialize', async (slice) => {
        await op.onSliceInitialized(slice.slice_id);
    });

    op.events.on('slice:retry', async (slice) => {
        await op.onSliceRetry(slice.slice_id);
    });

    op.events.on('slice:failure', async (slice) => {
        await op.onSliceFailed(slice.slice_id);
    });

    op.events.on('slice:success', async (slice) => {
        await op.onSliceFinalizing(slice.slice_id);
    });

    op.events.on('slice:finalize', async (slice) => {
        await op.onSliceFinished(slice.slice_id);
    });
}
