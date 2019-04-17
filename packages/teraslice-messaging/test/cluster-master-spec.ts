import 'jest-extended';

import findPort from './helpers/find-port';
import {
    formatURL,
    newMsgId,
    ClusterMaster
} from '../src';

describe('ClusterMaster', () => {
    describe('->Client', () => {
        describe('when constructed without a clusterMasterUrl', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ClusterMaster.Client({});
                }).toThrowError('ClusterMaster.Client requires a valid clusterMasterUrl');
            });
        });

        describe('when constructed without a exId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ClusterMaster.Client({
                        clusterMasterUrl: 'example.com',
                    });
                }).toThrowError('ClusterMaster.Client requires a valid exId');
            });
        });

        describe('when constructed with an invalid clusterMasterUrl', () => {
            let client: ClusterMaster.Client;

            beforeEach(() => {
                client = new ClusterMaster.Client({
                    clusterMasterUrl: 'http://idk.example.com',
                    exId: 'hello',
                    actionTimeout: 1000,
                    connectTimeout: 1000,
                    socketOptions: {
                        reconnection: false,
                    }
                });
            });

            it('start should throw an error', () => {
                const errMsg = /^Unable to connect to cluster master/;
                return expect(client.start()).rejects.toThrowError(errMsg);
            });
        });
    });

    describe('->Server', () => {
        describe('when constructed without a valid nodeDisconnectTimeout', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ClusterMaster.Server({
                        actionTimeout: 1,
                        networkLatencyBuffer: 0,
                    });
                }).toThrowError('ClusterMaster.Server requires a valid nodeDisconnectTimeout');
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
                nodeDisconnectTimeout: 3000
            });

            await server.start();

            client = new ClusterMaster.Client({
                exId,
                clusterMasterUrl,
                networkLatencyBuffer: 0,
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
            it('should not throw an error', () => {
                return expect(client.start()).resolves.toBeNil();
            });
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
                started: 'hellothere'
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

        it('should be able to handle exection pause', async () => {
            const onExecutionPause = jest.fn();

            client.onExecutionPause(onExecutionPause);

            await server.sendExecutionPause(exId);

            expect(onExecutionPause).toHaveBeenCalled();
        });

        it('should be able to handle exection resume', async () => {
            const onExecutionResume = jest.fn();

            client.onExecutionResume(onExecutionResume);

            await server.sendExecutionResume(exId);

            expect(onExecutionResume).toHaveBeenCalled();
        });
    });
});
