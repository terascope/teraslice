import 'jest-extended';
import { jest } from '@jest/globals';
import { TestContext } from '@terascope/job-components';
import { ExecutionService } from '../../src/lib/cluster/services/execution.js';

describe('ExecutionService', () => {
    describe('getSliceTap', () => {
        const tapResults = { workerId: 'some-worker', sliceId: 'some-slice', records: [] };

        function setup(apiTimeout: number, latencyBuffer: number) {
            const context = new TestContext('execution-service') as any;
            context.sysconfig.teraslice.api_response_timeout = apiTimeout;
            context.sysconfig.teraslice.network_latency_buffer = latencyBuffer;

            const sendSliceTapRequest = jest.fn<(...args: any[]) => Promise<any>>()
                .mockResolvedValue({ payload: tapResults });

            const service = new ExecutionService(context, {
                clusterMasterServer: { sendSliceTapRequest } as any
            });
            const warn = jest.spyOn(service.logger, 'warn').mockImplementation(() => {});

            return { service, sendSliceTapRequest, warn };
        }

        it.each([
            // api timeout, master send, exc send, tap
            [5 * 60_000, 255_000, 240_000, 255_000],
            [10 * 60_000, 555_000, 540_000, 555_000],
        ])('should stage the deadlines one buffer apart when api_response_timeout is %dms', async (
            apiTimeout, cmSendTimeout, ecSendTimeout, tapTimeout
        ) => {
            const { service, sendSliceTapRequest, warn } = setup(apiTimeout, 15_000);

            const results = await service.getSliceTap('some-ex-id', { size: 10 });

            expect(results).toEqual(tapResults);
            expect(sendSliceTapRequest).toHaveBeenCalledWith(
                'some-ex-id',
                { size: 10, sendTimeout: ecSendTimeout, tapTimeout },
                cmSendTimeout
            );
            expect(warn).not.toHaveBeenCalled();
        });

        it('should raise the tap timeout to the minimum and warn when api_response_timeout is too short', async () => {
            const { service, sendSliceTapRequest, warn } = setup(60_000, 15_000);

            await service.getSliceTap('some-ex-id', { size: 10 });

            // the layers stay one buffer apart once messenger adds 2 * buffer to each send:
            // the tap ends at 30s, the execution controller gives up at 45s
            // and the cluster master at 60s
            expect(sendSliceTapRequest).toHaveBeenCalledWith(
                'some-ex-id',
                { size: 10, sendTimeout: 15_000, tapTimeout: 30_000 },
                30_000
            );
            expect(warn).toHaveBeenCalledOnce();
        });

        it('should keep the send timeouts positive when network_latency_buffer is larger than the minimum', async () => {
            const { service, sendSliceTapRequest, warn } = setup(60_000, 45_000);

            await service.getSliceTap('some-ex-id', { size: 10 });

            expect(sendSliceTapRequest).toHaveBeenCalledWith(
                'some-ex-id',
                { size: 10, sendTimeout: 1000, tapTimeout: 46_000 },
                46_000
            );
            expect(warn).toHaveBeenCalledOnce();
        });

        it('should throw when the cluster master is shutting down', async () => {
            const { service, sendSliceTapRequest } = setup(5 * 60_000, 15_000);
            sendSliceTapRequest.mockResolvedValue(null);

            await expect(service.getSliceTap('some-ex-id', { size: 10 }))
                .rejects.toThrow('teraslice is shutting down');
        });
    });
});
