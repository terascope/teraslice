import 'jest-extended';
import * as index from '../src/index.js';

describe('index', () => {
    it('should export IndexManager', () => {
        expect(index.IndexManager).not.toBeNil();
    });

    it('should export IndexStore', () => {
        expect(index.IndexStore).not.toBeNil();
    });
});
