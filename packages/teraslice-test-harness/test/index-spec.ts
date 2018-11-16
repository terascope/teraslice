import 'jest-extended';
import * as index from '../src';

describe('index', () => {
    it('should have the test harnesses', () => {
        expect(index).not.toHaveProperty('JobTestHarness');
        expect(index).toHaveProperty('SlicerTestHarness');
        expect(index).toHaveProperty('WorkerTestHarness');
    });
});
