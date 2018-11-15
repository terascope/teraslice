import 'jest-extended';
import * as index from '../src';

describe('index', () => {
    it('should have JobHarness', () => {
        expect(index).toHaveProperty('JobHarness');
    });
});
