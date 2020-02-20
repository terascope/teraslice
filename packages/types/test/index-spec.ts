import 'jest-extended';
import * as index from '../src';

describe('index', () => {
    it('should export something', () => {
        expect(index).not.toBeNil();
    });
});
