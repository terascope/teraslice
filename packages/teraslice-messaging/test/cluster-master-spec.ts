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

        describe('when constructed without a jobId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ClusterMaster.Client({
                        clusterMasterUrl: 'example.com',
                        exId: 'ex-id'
                    });
                }).toThrowError('ClusterMaster.Client requires a valid jobId');
            });
        });

        describe('when constructed without a jobName', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ClusterMaster.Client({
                        clusterMasterUrl: 'example.com',
                        jobId: 'job-id',
                        exId: 'ex-id'
                    });
                }).toThrowError('ClusterMaster.Client requires a valid jobName');
            });
        });

        describe('when constructed with an invalid clusterMasterUrl', () => {
            let clusterMaster: ClusterMaster.Client;

            beforeEach(() => {
                clusterMaster = new ClusterMaster.Client({
                    clusterMasterUrl: 'http://idk.example.com',
                    jobId: 'job',
                    jobName: 'name',
                    exId: 'hello',
                    actionTimeout: 1000,
                    socketOptions: {
                        timeout: 1000,
                        reconnection: false,
                    }
                });
            });

            it('start should throw an error', () => {
                const errMsg = /^Unable to connect to cluster master/;
                return expect(clusterMaster.start()).rejects.toThrowError(errMsg);
            });
        });
    })

    describe('Client & Server', () => {
        let client: ClusterMaster.Client;
        let server: ClusterMaster.Server;
        let exId: string;
        let exOnlineFn: ClusterMaster.ExecutionEventFn = jest.fn();
        let exReadyFn: ClusterMaster.ExecutionEventFn = jest.fn();
        let exOfflineFn: ClusterMaster.ExecutionErrorEventFn = jest.fn();
        let exErrorFn: ClusterMaster.ExecutionErrorEventFn = jest.fn();

        beforeAll(async () => {
            exOnlineFn = jest.fn();
            exReadyFn = jest.fn();
            exOfflineFn = jest.fn();
            exErrorFn = jest.fn();

            const slicerPort = await findPort();
            const clusterMasterUrl = formatURL('localhost', slicerPort);
            server = new ClusterMaster.Server({
                port: slicerPort,
                networkLatencyBuffer: 0,
                actionTimeout: 1000,
            });

            await server.start();

            server.onExecutionOnline(exOnlineFn);
            server.onExecutionReady(exReadyFn);
            server.onExecutionOffline(exOfflineFn);
            server.onExecutionError(exErrorFn);

            exId = newMsgId();
            client = new ClusterMaster.Client({
                jobId: newMsgId(),
                jobName: 'job-name',
                exId,
                clusterMasterUrl,
                networkLatencyBuffer: 0,
                actionTimeout: 1000,
                socketOptions: {
                    timeout: 1000,
                    reconnection: false,
                },
            });

            // TODO Test all of the events

            await client.start();
        });

        beforeAll((done) => {
            server.onExecutionReady(() => { done() });
        })

        afterAll(async () => {
            await server.shutdown();
            await client.shutdown();
        });

        describe('when calling start on the client again', () => {
            it('should not throw an error', () => {
                return expect(client.start()).resolves.toBeNil()
            });
        });

        it('should have one connected executions', () => {
            expect(server.connectedExecutions()).toEqual(1);
        });

        it('should call server.onWorkerOnline', () => {
            expect(exOnlineFn).toHaveBeenCalledWith(exId);
        })

        it('should not call server.onWorkerReady', () => {
            expect(exReadyFn).toHaveBeenCalledWith(exId);
        })

        it('should not call server.onWorkerOffline', () => {
            expect(exOfflineFn).not.toHaveBeenCalledWith(exId);
        })
    })
});
