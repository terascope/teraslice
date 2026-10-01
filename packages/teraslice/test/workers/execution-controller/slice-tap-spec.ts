import 'jest-extended';
import { jest } from '@jest/globals';
import { debugLogger, pDelay, Queue } from '@terascope/core-utils';
import type { EnqueuedWorker } from '@terascope/types';
import { SliceTap, type SliceTapServer } from '../../../src/lib/workers/execution-controller/slice-tap.js';

describe('SliceTap', () => {
    const logger = debugLogger('slice-tap-spec');

    type SendFn = SliceTapServer['sendSliceTapRequest'];

    function makeServer() {
        const enqueueListeners: ((workerId: string) => void)[] = [];

        const server = {
            queue: new Queue<EnqueuedWorker>(),
            closed: false,
            isShuttingDown: false,
            onWorkerEnqueue(fn: (workerId: string) => void) {
                enqueueListeners.push(fn);
            },
            sendSliceTapRequest: jest.fn<SendFn>(async (workerId) => ({
                id: 'msg-id',
                eventName: 'worker:slice:tap',
                from: 'ExecutionController',
                to: workerId,
                payload: { sliceId: `${workerId}-slice`, records: [] },
            }) as any),
            enqueue(workerId: string) {
                if (!this.queue.exists('workerId', workerId)) {
                    this.queue.enqueue({ workerId });
                }
                enqueueListeners.forEach((fn) => fn(workerId));
            },
            dequeue(workerId: string) {
                this.queue.remove(workerId, 'workerId');
            }
        };

        return server;
    }

    function slowSend(server: ReturnType<typeof makeServer>, ms: number) {
        const send = server.sendSliceTapRequest.getMockImplementation()!;
        server.sendSliceTapRequest.mockImplementation(async (...args) => {
            await pDelay(ms);
            return send(...args);
        });
    }

    let server: ReturnType<typeof makeServer>;
    let sliceTap: SliceTap;

    beforeEach(() => {
        server = makeServer();
        sliceTap = new SliceTap(server, logger);
    });

    it('should send the tap to the worker at the head of the queue', async () => {
        server.enqueue('worker-1');
        server.enqueue('worker-2');

        const result = await sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 });

        expect(result).toEqual({ workerId: 'worker-1', sliceId: 'worker-1-slice', records: [] });
        expect(server.sendSliceTapRequest).toHaveBeenCalledWith(
            'worker-1',
            { size: 10, tapTimeout: expect.toBeWithin(1900, 2001) },
            expect.toBeWithin(2900, 3001)
        );
    });

    it('should send concurrent taps to different workers', async () => {
        server.enqueue('worker-1');
        server.enqueue('worker-2');

        const results = await Promise.all([
            sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 }),
            sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 }),
        ]);

        expect(results.map((r) => r.workerId)).toEqual(['worker-1', 'worker-2']);
    });

    it('should not send a second tap to a worker that is already tapping', async () => {
        server.enqueue('worker-1');
        slowSend(server, 1500);

        const tap = sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 });

        await expect(sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 1200 }))
            .rejects.toThrow(/Slice tap timeout/);

        await expect(tap).resolves.toMatchObject({ workerId: 'worker-1' });
        expect(server.sendSliceTapRequest).toHaveBeenCalledTimes(1);
    });

    it('should wait for a worker to be enqueued and send the tap before the next macrotask', async () => {
        const tap = sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 });

        await pDelay(100);
        expect(server.sendSliceTapRequest).not.toHaveBeenCalled();

        server.enqueue('worker-1');
        // the dispatch loop could dequeue the worker on the next macrotask
        await new Promise((resolve) => setImmediate(resolve));

        expect(server.sendSliceTapRequest).toHaveBeenCalledWith(
            'worker-1', expect.anything(), expect.anything()
        );
        await expect(tap).resolves.toMatchObject({ workerId: 'worker-1' });
    });

    it('should hand a released worker to a pending tap when all workers are busy', async () => {
        server.enqueue('worker-1');
        server.enqueue('worker-2');
        slowSend(server, 300);

        const start = Date.now();
        const results = await Promise.all([
            sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 }),
            sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 }),
            sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 }),
        ]);

        expect(results.map((r) => r.workerId)).toEqual(['worker-1', 'worker-2', 'worker-1']);
        // the third tap can only start after one of the first two finishes
        expect(Date.now() - start).toBeGreaterThanOrEqual(600);
    });

    it('should not hand a released worker to a pending tap if it was dequeued', async () => {
        server.enqueue('worker-1');
        slowSend(server, 300);

        const first = sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 });
        const second = sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 1500 });

        // dispatched a slice while tapping
        server.dequeue('worker-1');

        await expect(first).resolves.toMatchObject({ workerId: 'worker-1' });
        await expect(second).rejects.toThrow(/Slice tap timeout/);
    });

    it('should reject when no worker is enqueued before the timeout', async () => {
        await expect(sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 1200 }))
            .rejects.toThrow('Slice tap timeout, no worker became available within 1200ms');
    });

    it('should reject when too little of the tap timeout is left after waiting', async () => {
        const tap = sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 1500 });

        await pDelay(700);
        server.enqueue('worker-1');

        await expect(tap).rejects.toThrow(/Slice tap timeout after waiting \d+ms/);
        expect(server.sendSliceTapRequest).not.toHaveBeenCalled();
    });

    it('should reject pending taps when a worker is enqueued during shutdown', async () => {
        const tap = sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 });

        server.isShuttingDown = true;
        server.enqueue('worker-1');

        await expect(tap).rejects.toThrow(/finished or shutting down/);
    });

    it('should reject when the server returns no message', async () => {
        server.enqueue('worker-1');
        server.sendSliceTapRequest.mockResolvedValueOnce(null);

        await expect(sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 }))
            .rejects.toThrow('Cannot complete the slice tap for worker worker-1');
    });

    it('should release the worker when the tap fails', async () => {
        server.enqueue('worker-1');
        server.sendSliceTapRequest.mockRejectedValueOnce(new Error('slice slice-1 failed before completing'));

        await expect(sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 }))
            .rejects.toThrow('slice slice-1 failed before completing');

        await expect(sliceTap.tap({ size: 10, sendTimeout: 3000, tapTimeout: 2000 }))
            .resolves.toMatchObject({ workerId: 'worker-1' });
    });
});
