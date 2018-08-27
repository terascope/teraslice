import 'jest-extended';

import { ClusterMasterClient } from '../src';

describe('ClusterMasterClient', () => {
    describe('when constructed without a clusterMasterUrl', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new ClusterMasterClient({});
            }).toThrowError('ClusterMasterClient requires a valid clusterMasterUrl');
        });
    });

    describe('when constructed without a workerId', () => {
        it('should throw an error', () => {
            expect(() => {
                // @ts-ignore
                new ClusterMasterClient({
                    clusterMasterUrl: 'example.com'
                });
            }).toThrowError('ClusterMasterClient requires a valid controllerId');
        });
    });

    describe('when constructed with an invalid clusterMasterUrl', () => {
        let clusterMaster: ClusterMasterClient;

        beforeEach(() => {
            clusterMaster = new ClusterMasterClient({
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
});
