import 'jest-extended';
import * as index from '../src/index.js';

describe('index', () => {
    it('should have the test harnesses', () => {
        expect(index).not.toHaveProperty('BaseTestHarness');
        expect(index).toHaveProperty('JobTestHarness');
        expect(index).toHaveProperty('SlicerTestHarness');
        expect(index).toHaveProperty('WorkerTestHarness');
    });

    it('should have some test helpers', () => {
        expect(index).toHaveProperty('newTestSlice');
        expect(index.newTestSlice).toBeFunction();
        expect(index).toHaveProperty('newTestJobConfig');
        expect(index.newTestJobConfig).toBeFunction();
    });
});
