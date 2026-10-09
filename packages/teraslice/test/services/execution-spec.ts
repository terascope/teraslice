import 'jest-extended';
import { jest } from '@jest/globals';
import { TestContext } from '@terascope/job-components';
import { ExecutionService } from '../../src/lib/cluster/services/execution.js';

describe('ExecutionService', () => {
    describe('getSliceTap', () => {
        const tapResults = {
            workerId: 'some-worker',
            sliceId: 'some-slice',
            records: [[{ id: 1, name: 'quote " and \\ backslash' }], []]
        };

        function setup(apiTimeout: number, latencyBuffer: number) {
            const context = new TestContext('execution-service') as any;
            context.sysconfig.teraslice.api_response_timeout = apiTimeout;
            context.sysconfig.teraslice.network_latency_buffer = latencyBuffer;

            const sendSliceTapRequest = jest.fn<(...args: any[]) => Promise<any>>()
                .mockResolvedValue({
                    payload: {
                        workerId: tapResults.workerId,
                        sliceId: tapResults.sliceId,
                        records: Buffer.from(JSON.stringify(tapResults.records))
                    }
                });

            const service = new ExecutionService(context, {
                clusterMasterServer: { sendSliceTapRequest } as any
            });
            const warn = jest.spyOn(service.logger, 'warn').mockImplementation(() => {});

            return { service, sendSliceTapRequest, warn };
        }

        it.each([
            // api timeout, master send, exc send, tap
            [5 * 60_000, 284_000, 269_000, 269_000],
            [10 * 60_000, 584_000, 569_000, 569_000],
        ])('should stage the messaging deadlines one buffer apart when api_response_timeout is %dms', async (
            apiTimeout, cmSendTimeout, ecSendTimeout, tapTimeout
        ) => {
            const { service, sendSliceTapRequest, warn } = setup(apiTimeout, 15_000);

            const body = await service.getSliceTap('some-ex-id', { size: 10 });

            expect(JSON.parse(body.toString())).toEqual(tapResults);
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

            // the layers stay one buffer apart once messenger adds the buffer to each send:
            // the tap ends at 30s, the execution controller gives up at 45s
            // and the cluster master at 60s
            expect(sendSliceTapRequest).toHaveBeenCalledWith(
                'some-ex-id',
                { size: 10, sendTimeout: 30_000, tapTimeout: 30_000 },
                45_000
            );
            expect(warn).toHaveBeenCalledOnce();
        });

        it('should keep the deadlines one buffer apart when network_latency_buffer is larger than the minimum', async () => {
            const { service, sendSliceTapRequest, warn } = setup(60_000, 45_000);

            await service.getSliceTap('some-ex-id', { size: 10 });

            // the tap ends at 30s, the execution controller gives up at 75s
            // and the cluster master at 120s
            expect(sendSliceTapRequest).toHaveBeenCalledWith(
                'some-ex-id',
                { size: 10, sendTimeout: 30_000, tapTimeout: 30_000 },
                75_000
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
