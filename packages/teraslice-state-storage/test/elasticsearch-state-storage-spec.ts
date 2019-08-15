import 'jest-extended';
import { DataEntity, debugLogger, times } from '@terascope/utils';
import { ESCachedStateStorage, ESStateStorageConfig } from '../src';
import {
    ESBulkQuery,
    ESMGetResponse,
    ESGetResponse,
    ESGetParams,
    ESMGetParams,
    UpdateCacheFn
} from '../src/elasticsearch-state-storage';

describe('elasticsearch-state-storage', () => {
    const logger = debugLogger('elasticsearch-state-storage');
    let client: TestClient;
    let stateStorage: ESCachedStateStorage;

    async function setup(overrides?: Partial<ESStateStorageConfig>) {
        const config: ESStateStorageConfig = Object.assign({
            index: 'some_index',
            type: 'sometype',
            concurrency: 3,
            source_fields: [],
            chunk_size: 7,
            cache_size: 100000,
            max_big_map_size: 9,
            persist: false,
        }, overrides);

        client = new TestClient(config);
        stateStorage = new ESCachedStateStorage(client as any, logger, config);
        await stateStorage.initialize();
    }

    async function teardown() {
        if (stateStorage) {
            await stateStorage.shutdown();
            // @ts-ignore
            stateStorage = undefined;
        }
        if (client) {
            // @ts-ignore
            client = undefined;
        }
    }

    describe('when given invalid data', () => {
        beforeEach(() => setup());
        afterEach(() => teardown());

        describe('->get', () => {
            it('should not create get requests with undefined keys', async () => {
                const testDocs = [DataEntity.make({ data: 'someValue' })];
                await expect(stateStorage.get(testDocs[0])).rejects.toThrowError(/There is no field "_key" set in the metadata/);
            });
        });
    });

    describe('->get', () => {
        describe('when the found in cache', () => {
            const doc = makeTestDoc();
            let result: DataEntity|undefined;

            beforeAll(async () => {
                await setup();
                stateStorage.set(doc);
                result = await stateStorage.get(doc);
            });

            afterAll(() => teardown());

            it('should pull the same reference', async () => {
                expect(result).not.toBeUndefined();
                expect(result).toEqual(doc);
                expect(result).toBe(doc);
            });
        });

        describe('when the NOT found in cache but in es', () => {
            const doc = makeTestDoc();
            const esDoc = copyDataEntity(doc);
            let result: DataEntity|undefined;

            beforeAll(async () => {
                await setup();
                client.setGetResponse(client.createGetResponse(esDoc));
                result = await stateStorage.get(doc);
            });

            afterAll(() => teardown());

            it('should pull the es reference from the cache', async () => {
                expect(result).not.toBeUndefined();
                expect(result).toEqual(esDoc);
                expect(result).not.toBe(doc);
                expect(result).not.toEqual(doc);
            });
        });

        describe('when the NOT found in cache and NOT in es', () => {
            const doc = makeTestDoc();
            const esDoc = copyDataEntity(doc);
            let result: DataEntity|undefined;

            beforeAll(async () => {
                await setup();
                client.setGetResponse(client.createGetResponse(esDoc, false));
                result = await stateStorage.get(doc);
            });

            afterAll(() => teardown());

            it('should return undefined', async () => {
                expect(result).toBeUndefined();
            });
        });

        describe('when using an unknown doc', () => {
            const doc = makeTestDoc();
            let result: DataEntity|undefined;

            beforeAll(async () => {
                await setup();
                result = await stateStorage.get(doc);
            });

            afterAll(() => teardown());

            it('should return undefined', async () => {
                expect(result).toBeUndefined();
            });
        });
    });

    describe('->isKeyCached', () => {
        beforeEach(() => setup());
        afterEach(() => teardown());

        describe('when the record is in the cache', () => {
            const doc = makeTestDoc();
            const key = doc.getMetadata('_key');
            beforeEach(() => {
                stateStorage.set(doc);
            });

            it('should return true', async () => {
                expect(stateStorage.isKeyCached(key)).toBeTrue();
            });
        });

        describe('when the record is NOT in the cache', () => {
            it('should return false', async () => {
                expect(stateStorage.isKeyCached('uhoh')).toBeFalse();
            });
        });
    });

    describe('->isCached', () => {
        const doc = makeTestDoc();
        const key = doc.getMetadata('_key');

        beforeAll(async () => {
            await setup();
            stateStorage.set(doc);
        });
        afterAll(() => teardown());

        describe('when the record is in the cache', () => {
            it('should return true using the original doc', async () => {
                expect(stateStorage.isCached(doc)).toBeTrue();
            });

            it('should return true after getting it from the cache', async () => {
                const cached = stateStorage.getFromCacheByKey(key);
                if (!cached) {
                    expect(cached).not.toBeNil();
                    return;
                }
                expect(stateStorage.isCached(cached)).toBeTrue();
            });
        });

        describe('when the record is NOT in the cache', () => {
            it('should return true using the original doc', async () => {
                expect(stateStorage.isCached(doc)).toBeTrue();
            });

            it('should return true after getting it from the cache', async () => {
                const cached = stateStorage.getFromCacheByKey(key);
                if (!cached) {
                    expect(cached).not.toBeNil();
                    return;
                }
                expect(stateStorage.isCached(cached)).toBeTrue();
            });
        });
    });

    describe('->getFromCache', () => {
        describe('when the record is found', () => {
            const doc = makeTestDoc();
            beforeAll(async () => {
                await setup();
                stateStorage.set(doc);
            });
            afterAll(() => teardown());

            it('should return the same reference to the doc', () => {
                const cached = stateStorage.getFromCache(doc);
                expect(cached).toBe(doc);
                expect(cached).toEqual(doc);
            });
        });

        describe('when the record has been updated in the cache', () => {
            const doc = makeTestDoc();
            const newDoc = copyDataEntity(doc);

            beforeAll(async () => {
                await setup();
                stateStorage.set(doc);
                stateStorage.set(newDoc);
            });
            afterAll(() => teardown());

            it('should return the new reference to the doc', () => {
                const cached = stateStorage.getFromCache(doc);
                expect(cached).toBe(newDoc);
            });
        });

        describe('when the record is NOT found in es and the cache', () => {
            const doc = makeTestDoc();
            beforeAll(() => setup());
            afterAll(() => teardown());

            it('should return undefined', () => {
                expect(stateStorage.getFromCache(doc)).toBeUndefined();
            });
        });
    });

    describe('->mset', () => {
        describe('when presist is false', () => {
            beforeEach(() => setup());
            afterEach(() => teardown());

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
        });

        describe('when presist is true', () => {
            beforeEach(() => setup({
                persist: true,
                persist_field: '_key'
            }));
            afterEach(() => teardown());

            it('should make an es bulk request', async () => {
                const docArray = makeTestDocs();
                await stateStorage.mset(docArray);

                expect(client._bulkRequest).toBeArrayOfSize(6);
                expect(client._bulkRequest[0].index._id).toBe('key-0');
                expect(client._bulkRequest[1]).toEqual(docArray[0]);
                expect(client._bulkRequest[2].index._id).toBe('key-1');
                expect(client._bulkRequest[3]).toEqual(docArray[1]);
                expect(client._bulkRequest[4].index._id).toBe('key-2');
                expect(client._bulkRequest[5]).toEqual(docArray[2]);
            });
        });

        describe('when presist is true and field is specified', () => {
            beforeEach(() => setup({
                persist: true,
                persist_field: 'otherField'
            }));
            afterEach(() => teardown());

            it('should allow mset to use a persist field', async () => {
                const otherDocArray = makeTestDocs();
                await stateStorage.mset(otherDocArray);

                expect(client._bulkRequest).toBeArrayOfSize(6);
                expect(client._bulkRequest[0].index._id).toBe('other-0');
                expect(client._bulkRequest[1]).toEqual(otherDocArray[0]);
                expect(client._bulkRequest[2].index._id).toBe('other-1');
                expect(client._bulkRequest[3]).toEqual(otherDocArray[1]);
                expect(client._bulkRequest[4].index._id).toBe('other-2');
                expect(client._bulkRequest[5]).toEqual(otherDocArray[2]);
            });
        });
    });

    describe('->mget', () => {
        beforeEach(() => setup());
        afterEach(() => teardown());

        it('should return object with all docs in cache and in es request', async () => {
            const docArray = makeTestDocs();
            const docObj = docsToObject(docArray);
            const [inCache, ...inES] = docArray;
            stateStorage.set(inCache);

            // create bulk response
            client.setMGetResponse(client.createMGetResponse(inES));

            // state response
            const stateResponse = await stateStorage.mget(docArray);
            const keys = Object.keys(stateResponse);
            expect(keys).toBeArrayOfSize(3);

            keys.forEach((id: string) => {
                expect(stateResponse[id]).toEqual(docObj[id]);
                expect(DataEntity.isDataEntity(stateResponse[id])).toEqual(true);
                const metaId = stateResponse[id].getMetadata('_key');
                expect(metaId).toEqual(id);
            });
        });
    });

    describe('->sync', () => {
        const docArray = makeTestDocs(5);

        const inCacheCurrent = docArray[0];
        const prevInCacheUpdated = docArray[1];
        const inCacheUpdated = copyDataEntity(prevInCacheUpdated);
        const inESCurrent = docArray[2];
        const prevInESUpdated = docArray[3];
        const inESUpdated = copyDataEntity(prevInESUpdated);
        const notFoundInES = docArray[4];

        const inputDocArray: DataEntity[] = [];
        inputDocArray[0] = inCacheCurrent;
        inputDocArray[1] = inCacheUpdated;
        inputDocArray[2] = inESCurrent;
        inputDocArray[3] = inESUpdated;
        inputDocArray[4] = notFoundInES;

        const results: DataEntity[] = [];
        const setResults = (data: DataEntity) => results.push(data);

        const updateFnResults: { [key: string]: { current: DataEntity; prev?: DataEntity; } } = {};
        const fn: UpdateCacheFn = (key, current, prev) => {
            updateFnResults[key] = { current, prev };
            if (key === inCacheUpdated.getMetadata('_key')) return false;
            return true;
        };

        let response: any;

        beforeAll(async () => {
            await setup();
            stateStorage.set(inCacheCurrent);
            stateStorage.set(prevInCacheUpdated);
            // create bulk response
            const mgetResponse = client.createMGetResponse([inESCurrent, prevInESUpdated]);
            mgetResponse.docs.push(client.createGetResponse(notFoundInES, false));
            client.setMGetResponse(mgetResponse);

            response = await stateStorage.sync(inputDocArray, fn);
        });

        afterAll(() => teardown());

        it('should return undefined', () => {
            expect(response).toBeUndefined();
        });

        it('should store all of the correct values in the cache', async () => {
            await stateStorage.cache.values(setResults);

            expect(results.reverse()).toStrictEqual([
                inCacheCurrent,
                // the cache wasn't updated for this
                prevInCacheUpdated,
                inESCurrent,
                inESUpdated,
                notFoundInES,
            ]);
        });

        it(`should have called ${inputDocArray.length} times`, () => {
            expect(Object.keys(updateFnResults)).toBeArrayOfSize(inputDocArray.length);
        });

        it('should handle the current cache record correctly', () => {
            const key = inCacheCurrent.getMetadata('_key');
            const { current, prev } = updateFnResults[key];

            expect(current).toBe(inCacheCurrent);
            expect(prev).toBe(inCacheCurrent);
            expect(current).toStrictEqual(inCacheCurrent);
            expect(prev).toStrictEqual(inCacheCurrent);

            const cached = stateStorage.getFromCacheByKey(key);
            expect(cached).toBe(inCacheCurrent);
        });

        it('should handle the updated cache record correctly', () => {
            expect(inCacheUpdated).not.toBe(prevInCacheUpdated);

            const key = inCacheUpdated.getMetadata('_key');
            const { current, prev } = updateFnResults[key];

            expect(current).toBe(inCacheUpdated);
            expect(prev).toBe(prevInCacheUpdated);
            expect(prev).toStrictEqual(prevInCacheUpdated);
            expect(current).toStrictEqual(inCacheUpdated);
            expect(current).not.toBe(prev);

            const cached = stateStorage.getFromCacheByKey(key);
            expect(cached).toBe(prevInCacheUpdated);
        });

        it('should handle the current es record correctly', () => {
            const key = inESCurrent.getMetadata('_key');
            const { current, prev } = updateFnResults[key];

            expect(current).toBe(inESCurrent);
            expect(prev).not.toBe(inESCurrent);
            expect(prev).toEqual(inESCurrent);
            expect(current).toStrictEqual(inESCurrent);
            expect(prev).toStrictEqual(inESCurrent);

            const cached = stateStorage.getFromCacheByKey(key);
            expect(cached).not.toBe(prev);
            expect(cached).toEqual(prev);
            expect(cached).toBe(inESCurrent);
        });

        it('should handle the updated es record correctly', () => {
            expect(inESUpdated).not.toBe(prevInESUpdated);

            const key = inESUpdated.getMetadata('_key');
            const { current, prev } = updateFnResults[key];

            expect(current).toBe(inESUpdated);
            expect(prev).not.toBe(prevInESUpdated);
            expect(prev).toEqual(prevInESUpdated);
            expect(current).toStrictEqual(inESUpdated);
            expect(current).not.toBe(prev);

            const cached = stateStorage.getFromCacheByKey(key);
            expect(cached).not.toBe(prevInESUpdated);
            expect(cached).toBe(inESUpdated);
        });

        it('should handle the NOT found in es record correctly', () => {
            const key = notFoundInES.getMetadata('_key');
            const { current, prev } = updateFnResults[key];

            expect(prev).toBeUndefined();
            expect(current).toBe(notFoundInES);
            expect(current).toStrictEqual(notFoundInES);

            const cached = stateStorage.getFromCacheByKey(key);
            expect(cached).toBe(notFoundInES);
        });
    });

    describe('when testing a large data set', () => {
        jest.setTimeout(10000);

        beforeEach(() => setup());
        afterEach(() => teardown());

        it('should return all the found and cached docs', async () => {
            const docArray = makeTestDocs(5000);
            const docObj = docsToObject(docArray);

            // found by es
            const mgetDocs = client.createMGetResponse(docArray.slice(0, 2000));

            // not found by es
            const notFoundDocs = client.createMGetResponse(docArray.slice(2000, 3000), false);
            notFoundDocs.docs.forEach((item) => mgetDocs.docs.push(item));

            client.setMGetResponse(mgetDocs);

            // some docs already saved in cache
            await stateStorage.mset(docArray.slice(3000, 5000));

            // check that docs are in cache
            expect(stateStorage.count()).toBe(2000);

            // check on a doc
            const getCheck = await stateStorage.get(docObj['key-3483']);

            expect(getCheck).toEqual(docObj['key-3483']);

            // retrieve all the docs
            const mgetResult = await stateStorage.mget(docArray);
            // should not be any unfound docs
            expect(Object.keys(mgetResult).length).toBe(4000);

            // check a found es mget doc
            expect(mgetResult['key-1283']).toEqual(docObj['key-1283']);

            // check a found cached doc
            expect(mgetResult['key-4483']).toEqual(docObj['key-4483']);

            // check an unfound doc
            expect(mgetResult['key-2381']).toBeUndefined();
        });
    });
});

function makeTestDocs(records: number = 3): DataEntity[] {
    return times(records, (n) => DataEntity.make({
        data: `data-${n}`
    }, {
        _key: `key-${n}`,
        otherField: `other-${n}`
    }));
}

function makeTestDoc() {
    return makeTestDocs()[0];
}

function docsToObject(docs: DataEntity[]): { [key: string]: DataEntity } {
    const obj: { [key: string]: DataEntity } = {};
    for (const doc of docs) {
        const key = doc.getMetadata('_key');
        obj[key] = doc;
    }
    return obj;
}

function copyDataEntity(doc: DataEntity): DataEntity {
    const key = doc.getMetadata('_key');
    const updated = Object.assign({}, doc, { copy: `copy-${key}` });
    return DataEntity.make(updated, doc.getMetadata());
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
