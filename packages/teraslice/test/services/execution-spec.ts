import 'jest-extended';
import { jest } from '@jest/globals';
import { TestContext } from '@terascope/job-components';
import { ExecutionService } from '../../src/lib/cluster/services/execution.js';

describe('ExecutionService', () => {
    describe('getSliceTrace', () => {
        const traceResults = { workerId: 'some-worker', sliceId: 'some-slice', records: [] };

        function setup(apiTimeout: number, latencyBuffer: number) {
            const context = new TestContext('execution-service') as any;
            context.sysconfig.teraslice.api_response_timeout = apiTimeout;
            context.sysconfig.teraslice.network_latency_buffer = latencyBuffer;

            const sendSliceTraceRequest = jest.fn<(...args: any[]) => Promise<any>>()
                .mockResolvedValue({ payload: traceResults });

            const service = new ExecutionService(context, {
                clusterMasterServer: { sendSliceTraceRequest } as any
            });
            const warn = jest.spyOn(service.logger, 'warn').mockImplementation(() => {});

            return { service, sendSliceTraceRequest, warn };
        }

        it.each([
            // api timeout, cm send, ec send, trace
            [5 * 60_000, 255_000, 240_000, 255_000],
            [10 * 60_000, 555_000, 540_000, 555_000],
        ])('should stage the deadlines one buffer apart when api_response_timeout is %dms', async (
            apiTimeout, cmSendTimeout, ecSendTimeout, traceTimeout
        ) => {
            const { service, sendSliceTraceRequest, warn } = setup(apiTimeout, 15_000);

            const results = await service.getSliceTrace('some-ex-id', { size: 10 });

            expect(results).toEqual(traceResults);
            expect(sendSliceTraceRequest).toHaveBeenCalledWith(
                'some-ex-id',
                { size: 10, sendTimeout: ecSendTimeout, traceTimeout },
                cmSendTimeout
            );
            expect(warn).not.toHaveBeenCalled();
        });

        it('should raise the trace timeout to the minimum and warn when api_response_timeout is too short', async () => {
            const { service, sendSliceTraceRequest, warn } = setup(60_000, 15_000);

            await service.getSliceTrace('some-ex-id', { size: 10 });

            // the layers stay one buffer apart once messenger adds 2 * buffer to each send:
            // the trace ends at 30s, the execution controller gives up at 45s
            // and the cluster master at 60s
            expect(sendSliceTraceRequest).toHaveBeenCalledWith(
                'some-ex-id',
                { size: 10, sendTimeout: 15_000, traceTimeout: 30_000 },
                30_000
            );
            expect(warn).toHaveBeenCalledOnce();
        });

        it('should keep the send timeouts positive when network_latency_buffer is larger than the minimum', async () => {
            const { service, sendSliceTraceRequest, warn } = setup(60_000, 45_000);

            await service.getSliceTrace('some-ex-id', { size: 10 });

            expect(sendSliceTraceRequest).toHaveBeenCalledWith(
                'some-ex-id',
                { size: 10, sendTimeout: 1000, traceTimeout: 46_000 },
                46_000
            );
            expect(warn).toHaveBeenCalledOnce();
        });

        it('should throw when the cluster master is shutting down', async () => {
            const { service, sendSliceTraceRequest } = setup(5 * 60_000, 15_000);
            sendSliceTraceRequest.mockResolvedValue(null);

            await expect(service.getSliceTrace('some-ex-id', { size: 10 }))
                .rejects.toThrow('teraslice is shutting down');
        });
    });
});
