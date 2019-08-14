import 'jest-extended';
import { DataEntity, debugLogger } from '@terascope/utils';
import {
    ESCachedStateStorage,
    ESBulkQuery,
    ESStateStorageConfig,
    ESMGetResponse,
    ESGetResponse,
    ESGetParams,
    ESMGetParams
} from '../src';

describe('elasticsearch-state-storage', () => {
    const logger = debugLogger('ESCachedStateStorage');
    let client: TestClient;

    const config: ESStateStorageConfig = {
        index: 'some_index',
        type: 'sometype',
        concurrency: 10,
        source_fields: [],
        chunk_size: 10,
        cache_size: 100000,
        max_big_map_size: 5,
        persist: false,
    };

    let stateStorage: ESCachedStateStorage;

    beforeEach(() => {
        client = new TestClient(config);
        stateStorage = new ESCachedStateStorage(client as any, logger, config);
    });

    afterEach(() => {
        if (stateStorage) {
            stateStorage.shutdown();
            // @ts-ignore
            stateStorage = undefined;
        }
    });

    describe('->get', () => {
        it('should pull record from cache', async () => {
            const doc = makeTestDoc();
            stateStorage.set(doc);
            const stateDoc = await stateStorage.get(doc);

            expect(stateDoc).toEqual(doc);
            expect(DataEntity.isDataEntity(stateDoc)).toEqual(true);
        });

        it('should pull record from elasticsearch if not in cache', async () => {
            const doc = makeTestDoc();
            client.setGetResponse(client.createGetResponse(doc));

            const stateDoc = await stateStorage.get(doc);

            expect(stateDoc).toEqual(doc);
            expect(DataEntity.isDataEntity(stateDoc)).toEqual(true);
        });

        it('should make an es request if doc not in cache', async () => {
            const doc = makeTestDoc();
            // metadata props are not transfered, we are returning a regular obj at _source
            client.setGetResponse(client.createGetResponse(doc));
            const getResult = await stateStorage.get(doc);

            expect(getResult).toEqual(doc);
            expect(DataEntity.isDataEntity(getResult)).toEqual(true);
        });
    });

    describe('->getFromCache/->isCached', () => {
        it('checks cache, not elasticsearch for doc', async () => {
            const doc = makeTestDoc();
            const notFoundData = client.createGetResponse(doc, false);
            const foundData = client.createGetResponse(doc);

            client.setGetResponse(notFoundData);

            const empty = stateStorage.getFromCache(doc);

            expect(empty).toBeUndefined();
            expect(stateStorage.isCached(doc)).toEqual(false);

            client.setGetResponse(foundData);

            const stateDoc = await stateStorage.get(doc);

            expect(stateDoc).toEqual(doc);
            expect(DataEntity.isDataEntity(stateDoc)).toEqual(true);
            expect(stateStorage.isCached(doc)).toEqual(true);
        });
    });

    describe('->mset', () => {
        it('should save many docs to cache and retrieve', async () => {
            const docArray = makeTestDocs();
            await stateStorage.mset(docArray);

            const saved = [];
            for (const doc of docArray) {
                const savedDoc = await stateStorage.get(doc);
                saved.push(savedDoc);
                expect(DataEntity.isDataEntity(savedDoc)).toEqual(true);
            }

            expect(saved).toEqual(docArray);
        });

        it('should make an es bulk request if persist is true', async () => {
            const testConfig = Object.assign({}, config, {
                persist: true,
                persist_field: '_key'
            });
            const testClient = new TestClient(testConfig);
            const testStateStorage = new ESCachedStateStorage(testClient as any, logger, testConfig);

            const docArray = makeTestDocs();
            await testStateStorage.mset(docArray);
            const data = testClient._bulkRequest;

            expect(data).toBeArrayOfSize(6);
            expect(data[0].index._id).toBe('1');
            expect(data[1]).toEqual(docArray[0]);
            expect(data[2].index._id).toBe('2');
            expect(data[3]).toEqual(docArray[1]);
            expect(data[4].index._id).toBe('3');
            expect(data[5]).toEqual(docArray[2]);

            await testStateStorage.shutdown();
        });

        it('should allow mset to use a persist field', async () => {
            const testConfig = Object.assign({}, config, {
                persist: true,
                persist_field: 'otherField'
            });
            const testClient = new TestClient(testConfig);
            const testStateStorage = new ESCachedStateStorage(testClient as any, logger, testConfig);

            const otherDocArray = makeTestDocs(true);
            await testStateStorage.mset(otherDocArray);
            const data = testClient._bulkRequest;

            expect(data).toBeArrayOfSize(6);
            expect(data[0].index._id).toBe('other1');
            expect(data[1]).toEqual(otherDocArray[0]);
            expect(data[2].index._id).toBe('other2');
            expect(data[3]).toEqual(otherDocArray[1]);
            expect(data[4].index._id).toBe('other3');
            expect(data[5]).toEqual(otherDocArray[2]);

            await testStateStorage.shutdown();
        });
    });

    describe('->mget', () => {
        it('should return object with all docs in cache and in es request', async () => {
            const docArray = makeTestDocs();
            const [inCache, ...inES] = docArray;
            stateStorage.set(inCache);

            // create bulk response
            client.setMGetResponse(client.createMGetResponse(inES));

            // state response
            const stateResponse = await stateStorage.mget(docArray);
            const keys = Object.keys(stateResponse);
            expect(keys).toBeArrayOfSize(3);

            keys.forEach((idStr: string) => {
                const id = Number(idStr);
                expect(stateResponse[id]).toEqual(docArray[id - 1]);
                expect(DataEntity.isDataEntity(stateResponse[id])).toEqual(true);
                const metaId = stateResponse[id].getMetadata('_key');
                expect(`${metaId}`).toEqual(`${id}`);
            });
        });
    });

    describe('->sync', () => {
        it('should chech cache/fetch data but not return anything', async () => {
            const results: DataEntity[] = [];
            const setResults = (data: DataEntity) => results.push(data);

            const docArray = makeTestDocs();
            const [inCache, ...inES] = docArray;
            stateStorage.set(inCache);
            expect(stateStorage.isCached(inCache)).toBeTrue();

            // create bulk response
            client.setMGetResponse(client.createMGetResponse(inES));

            const fn = jest.fn(() => true);
            // state response
            const response = await stateStorage.sync(docArray, fn);
            expect(response).toBeUndefined();

            expect(fn).toHaveBeenCalledTimes(3);

            await stateStorage.cache.values(setResults);

            expect(results).toBeArrayOfSize(3);
            expect(results.reverse()).toEqual(docArray);
        });
    });

    it('should return all the found and cached docs', async () => {
        const mgetDocArray: DataEntity[] = [];
        for (let i = 0; i < 5000; i++) {
            mgetDocArray.push(DataEntity.make({ data: `dataFor${i}` }, { _key: `${i}` }));
        }

        // found by es
        const mgetDocs = client.createMGetResponse(mgetDocArray.slice(0, 2000));

        // not found by es
        const notFoundDocs = client.createMGetResponse(mgetDocArray.slice(2000, 3000), false);
        notFoundDocs.docs.forEach((item) => mgetDocs.docs.push(item));

        client.setMGetResponse(mgetDocs);

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

        // check a found es mget doc
        expect(mgetResult['1283']).toEqual(mgetDocArray['1283']);

        // check a found cached doc
        expect(mgetResult['4483']).toEqual(mgetDocArray['4483']);

        // check an unfound doc
        expect(mgetResult['2381']).toBeUndefined();
    });

    it('should not create get or mget requests with undefined keys', async () => {
        const testDocs = [DataEntity.make({ data: 'someValue' })];
        await expect(stateStorage.get(testDocs[0])).rejects.toThrowError(/There is no field "_key" set in the metadata/);
    });
});

function makeTestDocs(other = false): DataEntity[] {
    return [
        {
            data: 'thisIsFirstData',
        },
        {
            data: 'thisIsSecondData',
        },
        {
            data: 'thisIsThirdData',
        },
    ].map((obj, index) => DataEntity.make(obj, {
        _key: `${index + 1}`,
        ...(other && { otherField: `other${index + 1}` })
    }));
}

function makeTestDoc() {
    return makeTestDocs()[0];
}

interface BulkRequest {
    body: ESBulkQuery[];
}

class TestClient {
    private _getResponse!: ESGetResponse;
    private _mgetResponse!: ESMGetResponse;
    _bulkRequest!: ESBulkQuery[];
    private _config: ESStateStorageConfig;

    constructor(config: ESStateStorageConfig) {
        this._config = config;
    }

    createGetResponse(doc: DataEntity, found = true): ESGetResponse {
        return this.createMGetResponse([doc], found).docs[0];
    }

    createMGetResponse(dataArray: DataEntity[], found = true): ESMGetResponse {
        const docs = dataArray.map((item) => {
            const response: ESGetResponse = {
                _index: this._config.index,
                _type: this._config.type,
                _version: 1,
                _id: `${item.getMetadata('_key')}`,
                found,
            };

            if (found) {
                // convert to reg obj to simulate ES response
                response._source = Object.assign({}, item);
            } else {
                // @ts-ignore
                response._type = null;
                delete response._version;
            }

            return response;
        });

        return {
            docs,
        };
    }

    setGetResponse(response: ESGetResponse) {
        this._getResponse = response;
    }

    setMGetResponse(response: ESMGetResponse) {
        this._mgetResponse = response;
    }

    async get(params: ESGetParams) {
        if (params.index !== this._config.index) {
            throw new Error(`Invalid index ${params.index} on fake get`);
        }
        if (params.type !== this._config.type) {
            throw new Error(`Invalid type ${params.type} on fake get`);
        }
        if (!params.id) {
            throw new Error('Invalid ids to get');
        }
        return this._getResponse;
    }

    async mget(params: ESMGetParams) {
        if (!params.body.ids || !Array.isArray(params.body.ids)) {
            throw new Error('Invalid ids to mget');
        }
        if (params.index !== this._config.index) {
            throw new Error(`Invalid index ${params.index} on fake get`);
        }
        if (params.type !== this._config.type) {
            throw new Error(`Invalid type ${params.type} on fake get`);
        }
        for (const doc of this._mgetResponse.docs) {
            if (doc._index !== this._config.index) {
                throw new Error(`Invalid index ${doc._index} on fake mget`);
            }
            if (doc.found && doc._type !== this._config.type) {
                throw new Error(`Invalid type ${doc._type} on fake mget`);
            }
        }
        return this._mgetResponse;
    }

    async bulk(request: BulkRequest) {
        this._bulkRequest = request.body;
        return request;
    }
}
