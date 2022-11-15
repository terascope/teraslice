import 'jest-extended';
import * as index from '../src/index.js';

describe('index', () => {
    it('should export something', () => {
        expect(index).not.toBeNil();
    });
});
