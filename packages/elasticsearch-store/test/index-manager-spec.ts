import 'jest-extended';
import es from 'elasticsearch';
import { IndexManager } from '../src';

describe('IndexManager', () => {
    const client = new es.Client({});
    const indexManager = new IndexManager(client);

    it('should be an instance of IndexManager', () => {
        expect(indexManager).toBeInstanceOf(IndexManager);
    });
});
