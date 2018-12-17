import 'jest-extended';
import { IndexManager } from '../src';

describe('IndexManager', () => {
    const indexManager = new IndexManager();

    it('should be an instance of IndexManager', () => {
        expect(indexManager).toBeInstanceOf(IndexManager);
    });
});
