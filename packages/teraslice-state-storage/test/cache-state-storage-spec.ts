import 'jest-extended';
import { DataEntity } from '@terascope/entity-utils';
import { CachedStateStorage, SetTuple, EvictedEvent } from '../src/index.js';

describe('Cache Storage State', () => {
    const idField = '_key';

    const doc = DataEntity.make({ data: 'thisIsSomeData' }, { [idField]: '1' });

    const docArray = [
        {
            data: 'thisIsFirstData',
        },
        {
            data: 'thisIsSecondData',
        },
        {
            data: 'thisIsThirdData',
        },
    ].map((obj, index) => DataEntity.make(obj, { [idField]: `${index + 1}` }));

    const formattedMSet: SetTuple<DataEntity>[] = docArray.map((obj) => ({
        data: obj,
        key: obj.getKey()
    }));
    const formattedMGet = docArray.map((data) => data.getKey());

    const config = {
        id_field: idField,
        cache_size: 100000,
    };

    let cache: CachedStateStorage<DataEntity>;

    beforeEach(() => {
        cache = new CachedStateStorage(config);
    });

    afterEach(() => {
        cache.clear();
    });

    it('set should add items to the storage', () => {
        const key = doc.getKey();
        cache.set(key, doc);
        expect(cache.count()).toBe(1);
    });

    it('get should return data from storage', () => {
        const key = doc.getKey();
        cache.set(key, doc);
        const cachedData = cache.get(key);

        expect(cachedData).toEqual(doc);
        expect(DataEntity.isDataEntity(cachedData)).toEqual(true);
    });

    it('get should return undefined if not stored', () => {
        const key = doc.getKey();
        const cachedData = cache.get(key);
        expect(cachedData).toBeUndefined();
    });

    it('mset should add many items to storage', () => {
        cache.mset(formattedMSet);
        expect(cache.count()).toEqual(3);
    });
    // we are making this async becuase thats how the consumer will be using this
    it('values returns an iterator to fetch all values from cache', async () => {
        const results: DataEntity[] = [];
        cache.mset(formattedMSet);

        function mapper(data: DataEntity) {
            results.push(data);
        }

        await cache.values(mapper);

        expect(cache.count()).toEqual(3);
        expect(results).toBeArrayOfSize(3);
        expect(results.reverse()).toEqual(docArray);
    });

    it('mget should return many items from storage', () => {
        cache.mset(formattedMSet);
        const data = cache.mget(formattedMGet);
        const keys = Object.keys(data);
        expect(keys.length).toBe(3);

        keys.forEach((idStr: string) => {
            const id = Number(idStr);
            expect(data[id]).toEqual(docArray[id - 1]);
            expect(DataEntity.isDataEntity(data[id])).toEqual(true);
            const metaId = data[id].getKey();
            expect(metaId).toEqual(idStr);
        });
    });

    it('clear should remove all cached data', () => {
        cache.mset(formattedMSet);
        expect(cache.count()).toBe(docArray.length);
        cache.clear();
        expect(cache.count()).toBe(0);
    });

    it('when cache is to large using set emits an evicted event', async () => {
        let key: string;
        let data: DataEntity;

        const smallSizeConfig = {
            id_field: idField,
            cache_size: 2,
        };

        function catchEviction(evicted: EvictedEvent<DataEntity>) {
            key = evicted.key;
            data = evicted.data;
        }

        const testCache = new CachedStateStorage(smallSizeConfig);
        testCache.on('eviction', catchEviction);

        testCache.set(formattedMSet[0].key, formattedMSet[0].data);
        testCache.set(formattedMSet[1].key, formattedMSet[1].data);

        expect(key!).toBeUndefined();
        expect(data!).toBeUndefined();
        expect(testCache.count()).toEqual(2);

        testCache.set(formattedMSet[2].key, formattedMSet[2].data);

        expect(testCache.count()).toEqual(2);
        expect(key!).toEqual(formattedMSet[0].key);
        expect(data!).toEqual(formattedMSet[0].data);
    });

    it('when cache is to large using mset emits an evicted event', async () => {
        let key: string;
        let data: DataEntity;

        const smallSizeConfig = {
            id_field: idField,
            cache_size: 2,
        };

        function catchEviction(evicted: EvictedEvent<DataEntity>) {
            key = evicted.key;
            data = evicted.data;
        }

        const testCache = new CachedStateStorage(smallSizeConfig);
        testCache.on('eviction', catchEviction);

        testCache.mset(formattedMSet);

        expect(testCache.count()).toEqual(2);
        expect(key!).toEqual(formattedMSet[0].key);
        expect(data!).toEqual(formattedMSet[0].data);
    });
});
