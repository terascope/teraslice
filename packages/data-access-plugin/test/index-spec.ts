import 'jest-extended';
import * as index from '../src';

describe('index', () => {
    it('should export Example', () => {
        expect(index.Example).not.toBeNil();
    });
});
