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

        describe('when constructed without a workerId', () => {
            it('should throw an error', () => {
                expect(() => {
                    // @ts-ignore
                    new ClusterMaster.Client({
                        clusterMasterUrl: 'example.com'
                    });
                }).toThrowError('ClusterMaster.Client requires a valid controllerId');
            });
        });

        describe('when constructed with an invalid clusterMasterUrl', () => {
            let clusterMaster: ClusterMaster.Client;

            beforeEach(() => {
                clusterMaster = new ClusterMaster.Client({
                    clusterMasterUrl: 'http://idk.example.com',
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
