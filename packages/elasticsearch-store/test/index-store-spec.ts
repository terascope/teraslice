import 'jest-extended';
import es from 'elasticsearch';
import { IndexStore } from '../src';

describe('IndexStore', () => {
    const client = new es.Client({});

    const indexStore = new IndexStore(client, {
        index: 'hello',
        indexType: 'events',
        mapping: {}
    });

    it('should be an instance of IndexStore', () => {
        expect(indexStore).toBeInstanceOf(IndexStore);
    });
});
