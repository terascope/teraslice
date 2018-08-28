import 'jest-extended';

import { ClusterMaster } from '../src';

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

        describe('when constructed without a controllerId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ClusterMaster.Client({
                        clusterMasterUrl: 'example.com'
                    });
                }).toThrowError('ClusterMaster.Client requires a valid controllerId');
            });
        });

        describe('when constructed without a exId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ClusterMaster.Client({
                        clusterMasterUrl: 'example.com',
                        controllerId: 'controller-id'
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
                        controllerId: 'controller-id',
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
                        controllerId: 'controller-id',
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
                    exId: 'ex',
                    jobName: 'name',
                    controllerId: 'hello',
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
});
