import { Context } from '@terascope/teraslice-types';
import SliceEvents from '../core/slice-events';

interface SliceOperation extends SliceEvents {
    shutdown(): Promise<void>;
}

export default function sliceEventsShim(context: Context, op: SliceOperation) {
    const events = context.apis.foundation.getSystemEvents();
    events.once('worker:shutdown', async () => {
        await op.shutdown();
    });

    events.once('slice:initialize', async (slice) => {
        await op.onSliceInitialized(slice.slice_id);
    });

    events.once('slice:retry', async (slice) => {
        await op.onSliceRetry(slice.slice_id);
    });

    events.once('slice:failure', async (slice) => {
        await op.onSliceFailed(slice.slice_id);
    });

    events.once('slice:success', async (slice) => {
        await op.onSliceFinalizing(slice.slice_id);
    });

    events.once('slice:finalize', async (slice) => {
        await op.onSliceFinished(slice.slice_id);
    });
}
