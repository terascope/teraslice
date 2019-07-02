import 'jest-extended';
import * as index from '../src';

describe('index', () => {
    it('should export an object', () => {
        expect(index).toBeObject();
    });
});
