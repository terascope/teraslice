import 'jest-extended'; // require for type definitions
import * as index from '../src/index.js';

describe('Messaging Export', () => {
    it('should be truthy', () => {
        expect(index).toBeTruthy();
    });

    it('should have a Messenger', () => {
        expect(index.Messenger).toBeTruthy();
    });

    it('should have a ExecutionController', () => {
        expect(index.ExecutionController).toBeTruthy();
    });

    it('should have a ClusterMaster', () => {
        expect(index.ClusterMaster).toBeTruthy();
    });
});
