
import 'jest-extended';
import { DataEntity, debugLogger } from '@terascope/job-components';
import { ESCachedStateStorage, ESBulkQuery, ESStateStorageConfig } from '../src';

describe('elasticsearch cached state storage', () => {

    interface Doc {
        _index: string;
        _type: string;
        _version: number;
        _id: string;
        found: boolean;
        _source?: any;
    }

    interface MGetData {
        docs: Doc[];
    }

    interface BulkRequest {
        body: ESBulkQuery[];
    }

    class TestClient {
        public getData!: Doc;
        public mgetData!: MGetData;
        public mgetSearch!: any;
        public bulkRequest!: ESBulkQuery[];

        setGetData(data: Doc) {
            this.getData = data;
        }

        setMGetData(data: MGetData) {
            this.mgetData = data;
        }

        async get(_doc: Doc) {
            return this.getData;
        }

        async mget(mgetSearch: any) {
            // this.mgetData = mgetSearch;
            return this.mgetData;
        }

        async bulk(request: BulkRequest) {
            this.bulkRequest = request.body;
            return request;
        }
    }

    const logger = debugLogger('ESCachedStateStorage');
    const client = new TestClient();

    const idField = '_key';

    const doc = DataEntity.make({ data: 'thisIsSomeData' }, { [idField]: 1 });
 // @ts-ignore
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

    const otherDocArray = [
        {
            data: 'thisIsFirstData'
        },
        {
            data: 'thisIsSecondData'
        },
        {
            data: 'thisIsThirdData'
        }
    ].map((obj, index) => DataEntity.make(obj, { [idField]: index + 1, otherField: `other${index + 1}` }));

    function createMgetData(dataArray: DataEntity[], found = true) {
        return dataArray.map((item) => {
            const response: Doc = {
                _index: 'index',
                _type: 'type',
                _version: 1,
                _id: item.getMetadata(idField),
                found
            };

            if (found) {
                // convert to reg obj to simulate ES response
                response._source = Object.assign({}, item);
            }

            return response;
        });
    }

    const config: ESStateStorageConfig = {
        index: 'some_index',
        type: 'sometype',
        concurrency: 10,
        source_fields: [],
        chunk_size: 10,
        cache_size: 100000,
        max_age: 24 * 3600 * 1000,
        persist: false,
        persist_field: idField
    };

    let stateStorage: ESCachedStateStorage;

    beforeEach(() => {
        // @ts-ignore
        stateStorage = new ESCachedStateStorage(client, logger, config);
    });

    afterEach(() => {
        stateStorage.shutdown();
    });

    it('should save doc in cache and retrieve it', async () => {
        stateStorage.set(doc);
        const stateDoc = await stateStorage.get(doc);

        expect(stateDoc).toEqual(doc);
        expect(DataEntity.isDataEntity(stateDoc)).toEqual(true);
    });

    it('should save many docs to cache and retrieve', async () => {
        await stateStorage.mset(docArray, idField);

        const saved1 = await stateStorage.get(docArray[0]);
        const saved2 = await stateStorage.get(docArray[1]);
        const saved3 = await stateStorage.get(docArray[2]);

        expect(saved1).toEqual(docArray[0]);
        expect(saved2).toEqual(docArray[1]);
        expect(saved3).toEqual(docArray[2]);

        expect(DataEntity.isDataEntity(saved1)).toEqual(true);
        expect(DataEntity.isDataEntity(saved2)).toEqual(true);
        expect(DataEntity.isDataEntity(saved3)).toEqual(true);
    });

    it('should make an es bulk request if persist is true', async () => {
        const testConfig = Object.assign({}, config, { persist: true, persist_field: '_key' });
        // @ts-ignore
        const testStateStorage = new ESCachedStateStorage(client, logger, testConfig);

        await testStateStorage.mset(docArray, '_key');
        const data = client.bulkRequest;

        expect(data.length).toBe(6);
        expect(data[1]).toEqual(docArray[0]);
    });

    it('should allow mset to use a persist field', async () => {
        const testConfig = Object.assign({}, config, { persist: true, persist_field: 'otherField' });
        // @ts-ignore
        const testStateStorage = new ESCachedStateStorage(client, logger, testConfig);

        await testStateStorage.mset(otherDocArray);
        const data = client.bulkRequest;

        expect(data[0].index._id).toBe('other1');
        expect(data[2].index._id).toBe('other2');
        expect(data[4].index._id).toBe('other3');
    });

    it('should ake an es request if doc not in cache', async () => {
        // metadata props are not transfered, we are returning a regular obj at _source
        const cloneDoc = Object.assign({}, doc);
        client.setGetData({
            _index: config.index,
            _type: config.type,
            _version: 1,
            _id: doc.getMetadata(idField),
            found: true,
            _source: cloneDoc
        });
        const getResult = await stateStorage.get(doc);

        expect(getResult).toEqual(doc);
        expect(DataEntity.isDataEntity(getResult)).toEqual(true);
    });

    it('should return object with all docs in cache and in es request', async () => {
        // set doc in cache
        await stateStorage.mset(docArray.slice(0, 1));

        // create bulk response
        client.setMGetData({ docs: createMgetData(docArray.slice(1, 3)) });

        // state response
        const stateResponse = await stateStorage.mget(docArray);
        const keys = Object.keys(stateResponse);
        expect(keys.length).toBe(3);

        keys.forEach((idStr:string) => {
            const id = Number(idStr);
            expect(stateResponse[id]).toEqual(docArray[id - 1]);
            expect(DataEntity.isDataEntity(stateResponse[id])).toEqual(true);
            const metaId = stateResponse[id].getMetadata(idField);
            expect(metaId).toEqual(id);
        });
    });

    it('should return all the found and cached docs', async () => {
        const mgetDocArray: DataEntity[] = [];
        for (let i = 0; i < 5000; i += 1) {
            mgetDocArray.push(DataEntity.make({ data: `dataFor${i}` }, { [idField]: i }));
        }

        // found by es
        const mgetDocs = createMgetData(mgetDocArray.slice(0, 2000));

        // not found by es
        const notFoundDocs = createMgetData(mgetDocArray.slice(2000, 3000), false);
        notFoundDocs.forEach(item => mgetDocs.push(item));

        client.setMGetData({ docs: mgetDocs });

        // some docs already saved in cache
        await stateStorage.mset(mgetDocArray.slice(3000, 5000));

        // check that docs are in cache
        expect(stateStorage.count()).toBe(2000);

        // check on a doc
        const getCheck = await stateStorage.get(mgetDocArray['3484']);

        expect(getCheck).toEqual(mgetDocArray['3484']);

        // retrieve all the docs
        const mgetResult = await stateStorage.mget(mgetDocArray);
        // should not be any unfound docs
        expect(Object.keys(mgetResult).length).toBe(4000);

        // check a found mget doc
        expect(mgetResult['1283']).toEqual(mgetDocArray['1283']);

        // check a found cached doc
        expect(mgetResult['4483']).toEqual(mgetDocArray['4483']);

        // check an unfound doc
        expect(mgetResult['2381']).toBeUndefined();
    });

    it('should not create get or mget requests with undefined keys', async () => {
        expect.hasAssertions();
        const testDocs = [DataEntity.make({ data: 'someValue' })];
        try {
            // @ts-ignore
            await stateStorage.get(testDocs[0]);
        } catch (err) {
            expect(err.message.includes('There is no field "_key" set in the metadata')).toEqual(true);
        }
    });

    it('dedupe removes docs with duplicate keys', () => {
        const doubleDocs = [...docArray, ...docArray];
        // @ts-ignore
        const deduped = stateStorage._dedupeDocs(doubleDocs);
        expect(doubleDocs.length).toBe(6);
        expect(deduped.length).toBe(3);
    });
});
