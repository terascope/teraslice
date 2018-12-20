import 'jest-extended';
import es from 'elasticsearch';
import { IndexStore } from '../src';

describe('IndexStore', () => {
    const client = new es.Client({});

    const indexStore = new IndexStore(client, {
        index: 'hello',
        indexType: 'events',
        indexSchema: {
            version: '1.0.0',
            mapping: {},
            strict: true,
        }
    });

    it('should be an instance of IndexStore', () => {
        expect(indexStore).toBeInstanceOf(IndexStore);
    });
});
