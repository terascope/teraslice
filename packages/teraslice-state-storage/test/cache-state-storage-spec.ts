
import 'jest-extended';
import { DataEntity } from '@terascope/job-components';
import { CachedStateStorage } from '../src';

describe('Cache Storage State', () => {

    const idField = 'id';

    const doc = DataEntity.make({ data: 'thisIsSomeData' }, { [idField]: 1 });

    const docArray = [
        {
            data: 'thisIsFirstData'
        },
        {
            data: 'thisIsSecondData'
        },
        {
            data: 'thisIsThirdData'
        }
    ].map((obj, index) => DataEntity.make(obj, { [idField]: index + 1 }));

    const config = {
        id_field: idField,
        cache_size: 100000,
        max_age: 24 * 3600 * 1000
    };

    let cache: CachedStateStorage;

    beforeEach(() => {
        cache = new CachedStateStorage(config);
    });

    afterEach(() => {
        cache.shutdown();
    });

    it('set should add items to the storage', () => {
        cache.set(doc);
        expect(cache.count()).toBe(1);
    });

    it('get should return data from storage', () => {
        cache.set(doc);
        const cachedData = cache.get(doc);

        expect(cachedData).toEqual(doc);
        expect(DataEntity.isDataEntity(cachedData)).toEqual(true);
    });

    it('get should return undefined if not stored', () => {
        const cachedData = cache.get(doc);
        expect(cachedData).toBeUndefined();
    });

    it('delete should delete item from storage', () => {
        cache.set(doc);
        cache.delete(doc);
        expect(cache.get(doc)).toBeUndefined();
    });

    it('mset should add many items to storage', () => {
        cache.mset(docArray);
        expect(cache.count()).toEqual(3);
    });

    it('mget should return many items from storage', () => {
        cache.mset(docArray);
        const data = cache.mget(docArray);
        const keys = Object.keys(data);
        expect(keys.length).toBe(3);

        keys.forEach((idStr:string) => {
            const id = Number(idStr);
            expect(data[id]).toEqual(docArray[id - 1]);
            expect(DataEntity.isDataEntity(data[id])).toEqual(true);
            const metaId = data[id].getMetadata(idField);
            expect(metaId).toEqual(id);
        });
    });

    it('mdelete should delete many records from storage', () => {
        cache.mset(docArray);
        cache.mdelete(docArray);
        expect(cache.count()).toBe(0);
    });

    it('shutdown should remove all cached data', () => {
        cache.mset(docArray);
        expect(cache.count()).toBe(docArray.length);
        cache.shutdown();
        expect(cache.count()).toBe(0);
    });
});
