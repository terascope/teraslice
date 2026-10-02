import 'jest-extended';
import { jest } from '@jest/globals';
import { findPort } from './helpers/index.js';
import { formatURL, newMsgId, ClusterMaster } from '../src/index.js';

describe('ClusterMaster', () => {
    describe('->Client', () => {
        describe('when constructed without a clusterMasterUrl', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new ClusterMaster.Client({});
                }).toThrow('ClusterMaster.Client requires a valid clusterMasterUrl');
            });
        });

        describe('when constructed without a exId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new ClusterMaster.Client({
                        clusterMasterUrl: 'example.com',
                    });
                }).toThrow('ClusterMaster.Client requires a valid exId');
            });
        });

        describe('when constructed without a nodeDisconnectTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new ClusterMaster.Client({
                        clusterMasterUrl: 'example.com',
                        exId: 'test',
                    });
                }).toThrow('ClusterMaster.Client requires a valid nodeDisconnectTimeout');
            });
        });

        describe('when constructed with an invalid clusterMasterUrl', () => {
            let client: ClusterMaster.Client;

            beforeEach(() => {
                client = new ClusterMaster.Client({
                    clusterMasterUrl: 'http://idk.example.com',
                    exId: 'hello',
                    nodeDisconnectTimeout: 1000,
                    actionTimeout: 1000,
                    connectTimeout: 1000,
                    socketOptions: {
                        reconnection: false,
                    },
                });
            });

            it('start should throw an error', () => {
                const errMsg = /^Unable to connect to ClusterMaster at/;
                return expect(client.start()).rejects.toThrow(errMsg);
            });
        });
    });

    describe('->Server', () => {
        describe('when constructed without a valid nodeDisconnectTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-expect-error
                    new ClusterMaster.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                    });
                }).toThrow('ClusterMaster.Server requires a valid nodeDisconnectTimeout');
            });
        });
    });

    describe('Client & AssetClient & Server', () => {
        let client: ClusterMaster.Client;
        let server: ClusterMaster.Server;
        let exId: string;

        beforeAll(async () => {
            exId = await newMsgId();
            const slicerPort = await findPort();
            const clusterMasterUrl = formatURL('localhost', slicerPort);
            server = new ClusterMaster.Server({
                port: slicerPort,
                networkLatencyBuffer: 0,
                actionTimeout: 1000,
                nodeDisconnectTimeout: 3000,
            });

            await server.start();

            client = new ClusterMaster.Client({
                exId,
                clusterMasterUrl,
                networkLatencyBuffer: 0,
                nodeDisconnectTimeout: 1000,
                actionTimeout: 1000,
                connectTimeout: 1000,
                socketOptions: {
                    reconnection: false,
                },
            });

            await client.start();
            await client.sendAvailable();
        });

        afterAll(async () => {
            await server.shutdown();
            await client.shutdown();
        });

        describe('when calling start on the client again', () => {
            it('should not throw an error', () => expect(client.start()).resolves.toBeNil());
        });

        it('should have one connected executions', () => {
            expect(server.onlineClientCount).toEqual(1);
        });

        it('should be able to handle execution analytics', () => {
            const analytics = {
                workers_available: 1,
                workers_active: 1,
                workers_joined: 1,
                workers_reconnected: 1,
                workers_disconnected: 1,
                failed: 1,
                subslices: 1,
                queued: 1,
                slice_range_expansion: 1,
                processed: 1,
                slicers: 1,
                subslice_by_key: 1,
                started: 'hellothere',
            };

            client.onExecutionAnalytics(() => analytics);

            return expect(server.sendExecutionAnalyticsRequest(exId)).resolves.toHaveProperty('payload', analytics);
        });

        it('should be able to handle cluster analytics', async () => {
            const analytics = {
                processed: 1,
                failed: 1,
                queued: 1,
                job_duration: 1,
                workers_joined: 1,
                workers_disconnected: 1,
                workers_reconnected: 1,
            };

            const previousAnalytics = server.getClusterAnalytics();

            await client.sendClusterAnalytics(analytics);

            expect(server.getClusterAnalytics()).not.toEqual(previousAnalytics);
        });

        it('should be able to handle execution finished', async () => {
            const onExecutionFinished = jest.fn();

            server.onExecutionFinished(onExecutionFinished);

            await client.sendExecutionFinished();

            expect(onExecutionFinished).toHaveBeenCalled();
        });

        it('should be able to handle execution pause', async () => {
            const onExecutionPause = jest.fn() as any;

            client.onExecutionPause(onExecutionPause);

            await server.sendExecutionPause(exId);

            expect(onExecutionPause).toHaveBeenCalled();
        });

        it('should be able to handle execution resume', async () => {
            const onExecutionResume = jest.fn() as any;

            client.onExecutionResume(onExecutionResume);

            await server.sendExecutionResume(exId);

            expect(onExecutionResume).toHaveBeenCalled();
        });

        describe('when sending execution:slice:tap', () => {
            const request = { size: 10, sendTimeout: 800, tapTimeout: 500 };
            const tapResults = {
                workerId: 'some-worker',
                sliceId: 'tapped-slice',
                records: [[{ record: { id: 1 }, metadata: { _key: '1' } }]]
            };

            // each onExecutionSliceTap call adds a socket listener,
            // so register once and swap the implementation per test
            const handler = jest.fn<(msg: any) => any>();

            beforeAll(() => {
                client.onExecutionSliceTap(handler);
            });

            it('should pass the request to the execution and return its tap', async () => {
                handler.mockImplementation(() => tapResults);

                const msg = await server.sendSliceTapRequest(exId, request, 1000);

                expect(handler).toHaveBeenCalledWith(
                    expect.objectContaining({ payload: request })
                );
                expect(msg).toHaveProperty('payload', tapResults);
            });

            it('should deliver serialized records as a Buffer', async () => {
                const records = Buffer.from(JSON.stringify(tapResults.records));
                handler.mockImplementation(() => ({ ...tapResults, records }));

                const msg = await server.sendSliceTapRequest(exId, request, 1000);

                expect(Buffer.isBuffer(msg?.payload.records)).toBeTrue();
                expect(msg?.payload.records.equals(records)).toBeTrue();
            });

            it('should reject with the execution error when the tap fails', async () => {
                handler.mockImplementation(async () => {
                    throw new Error('Slice tap timeout after 1s; no worker became available');
                });

                await expect(server.sendSliceTapRequest(exId, request, 1000))
                    .rejects.toThrow('Slice tap timeout after 1s; no worker became available');
            });
        });
    });
});
