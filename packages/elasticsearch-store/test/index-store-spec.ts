import 'jest-extended';
import { IndexStore } from '../src';

describe('IndexStore', () => {
    const indexStore = new IndexStore();

    it('should be an instance of IndexStore', () => {
        expect(indexStore).toBeInstanceOf(IndexStore);
    });
});
