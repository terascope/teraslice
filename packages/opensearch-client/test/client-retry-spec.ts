import 'jest-extended';
import { ClientParams } from '@terascope/types';
import { debugLogger, pDelay, unset } from '@terascope/core-utils';
import {
    createClient, Client, ElasticsearchTestHelpers,
    convertToDocs
} from '../src/index.js';
import { FakeClient, template1 } from './fake-client.js';

const {
    populateIndex, cleanupIndex, waitForData,
    getTestENVClientInfo, EvenDateData,
} = ElasticsearchTestHelpers;

type EvenData = ElasticsearchTestHelpers.Data;
const { data, EvenDataType } = EvenDateData;

async function waitFor(time: number, fn: any) {
    await pDelay(time);
    if (fn) {
        fn();
    }
    return true;
}

describe('client retry functionality apis', () => {
    const prefix = 'retry_test_';
    const testLogger = debugLogger('client-retry-test');

    function buildIndexName(index: string) {
        return `${prefix}_${index}`;
    }

    const {
        host,
        ...clientMetadata
    } = getTestENVClientInfo();

    const config = { node: host };

    const index = buildIndexName('base');

    let client: Client;
    let fakeClient: FakeClient;

    beforeAll(async () => {
        ({ client } = await createClient(config, testLogger));

        await Promise.all([
            cleanupIndex(client, buildIndexName('*')),
        ]);

        if (clientMetadata.version.split('.').length !== 3) {
            throw new Error(`Expected version to follow semver format (major.minor.patch) got ${clientMetadata.version}`);
        }

        await populateIndex(client, index, EvenDataType, data);
        await waitForData(client, index, 1000);
    }, 15000);

    beforeEach(() => {
        fakeClient = new FakeClient();
        fakeClient.version = clientMetadata.version;
    });

    describe('isClientConnected', () => {
        it('should work and not throw', () => {
            expect(() => client.isClientConnected()).not.toThrow();
        });
    });

    fdescribe('searchWithRetry', () => {
        it('should create a mew record', async () => {
            const query: ClientParams.SearchParams = { index, size: data.length };
            const response = await client.searchWithRetry<EvenData>(query);

            const results = convertToDocs<EvenData>(response);

            expect(results).toBeArrayOfSize(data.length);
        });

        describe('mocked client tests', () => {
            it('search can handle rejection errors', async () => {
                const query = { body: 'someQuery' } as any;
                let queryFailed = false;

                fakeClient.searchError = { body: { error: { type: 'es_rejected_execution_exception' } } } as any;
                fakeClient.recordsReturned = [{ _source: { some: 'data' } }];

                const testClient = new Client(fakeClient, clientMetadata);

                const [results] = await Promise.all([
                    testClient.searchWithRetry(query),
                    waitFor(50, () => {
                        fakeClient.searchError = false;
                    })
                ]);

                expect(convertToDocs(results)).toEqual([fakeClient.recordsReturned[0]._source]);
                fakeClient.searchError = { body: { error: { type: 'some_thing_else' } } };

                try {
                    await testClient.searchWithRetry(query);
                } catch (_err) {
                    queryFailed = true;
                }

                return expect(queryFailed).toEqual(true);
            });

            it('search can handle retryable shard errors', async () => {
                const query = { body: 'someQuery' } as any;

                fakeClient.failed = 3;
                fakeClient.failures = [{ reason: { type: 'es_rejected_execution_exception' } }];
                fakeClient.recordsReturned = [{ _source: { some: 'data' } }];

                const testClient = new Client(fakeClient, clientMetadata);

                const [results] = await Promise.all([
                    testClient.searchWithRetry(query),
                    waitFor(20, () => {
                        fakeClient.failed = 0;
                        fakeClient.failures = [];
                    })
                ]);

                expect(convertToDocs(results)).toEqual([fakeClient.recordsReturned[0]._source]);
            });

            fit('search can handle shard errors', async () => {
                const query = { body: 'someQuery' } as any;
                let queryFailed = false;

                fakeClient.failed = 4;
                fakeClient.failures = [{ reason: { type: 'some other error' } }];

                const testClient = new Client(fakeClient, clientMetadata);

                try {
                    await Promise.all([
                        testClient.searchWithRetry(query),
                        waitFor(50, () => {
                            fakeClient.failed = 0;
                            fakeClient.failures = [];
                        })
                    ]);
                } catch (_err) {
                    queryFailed = true;
                }

                return expect(queryFailed).toEqual(true);
            });
        });
    });

    describe('bulkWithRetry', () => {
        describe('mocked client tests', () => {
            it('can call bulkSend with errors', async () => {
                // @ts-expect-error TODO: fixme
                const myBulkData: ClientParams.BulkParams = [{
                    action: {
                        index: { _index: 'some_index', _id: 1 }
                    },
                    data: { title: 'foo' }
                },
                {
                    action: {
                        delete: { _index: 'some_index', _id: 5 }
                    }
                }];

                fakeClient.bulkError = [
                    'es_rejected_execution_exception',
                    'es_rejected_execution_exception',
                ];

                waitFor(20, () => {
                    fakeClient.bulkError = false;
                });

                const testClient = new Client(fakeClient, clientMetadata);

                const result = await testClient.bulkWithRetry(myBulkData);

                expect(result).toBe(2);

                fakeClient.bulkError = ['some_thing_else', 'some_thing_else'];

                await expect(
                    testClient.bulkWithRetry(myBulkData)
                ).rejects.toThrow('bulk send error: some_thing_else--someReason');
            });
        });
    });

    describe('createWithRetry', () => {
        it('should return valid results', async () => {
            const createIndex = buildIndexName('create');
            const id = '1234';
            const query: ClientParams.CreateParams = {
                index: createIndex,
                id,
                body: { some: 'record' }
            };
            const response = await client.createWithRetry(query);

            expect(response).toBeDefined();

            const { _index, _id, result } = response;
            expect(_index).toEqual(createIndex);
            expect(_id).toEqual(id);
            expect(result).toEqual('created');
        });
    });

    describe('indexWithRetry', () => {
        it('should return valid results', async () => {
            const indIndex = buildIndexName('index');
            const id = '1234';
            const query: ClientParams.IndexParams = {
                index: indIndex,
                id,
                body: { some: 'record' }
            };
            const response = await client.indexWithRetry(query);

            expect(response).toBeDefined();

            const { _index, _id, result } = response;
            expect(_index).toEqual(indIndex);
            expect(_id).toEqual(id);
            expect(result).toEqual('created');
        });
    });

    describe('updateWithRetry', () => {
        it('should return valid results', async () => {
            const updateIndex = buildIndexName('update');
            const id = '1234';

            const createQuery: ClientParams.CreateParams = {
                index: updateIndex,
                id,
                body: { some: 'record', foo: 'bar' }
            };

            await client.createWithRetry(createQuery);

            const query: ClientParams.UpdateParams = {
                index: updateIndex,
                id,
                body: {
                    doc: { foo: 'baz' }
                }
            };
            const response = await client.updateWithRetry(query);

            expect(response).toBeDefined();

            const { _index, _id, result } = response;

            expect(_index).toEqual(updateIndex);
            expect(_id).toEqual(id);
            expect(result).toEqual('updated');
        });
    });

    describe('countWithRetry', () => {
        it('should return valid results', async () => {
            const response = await client.countWithRetry({ index });

            expect(response).toBeDefined();

            const { count } = response;
            expect(count).toEqual(data.length);
        });
    });

    describe('deleteWithRetry', () => {
        it('should return valid results', async () => {
            const deleteIndex = buildIndexName('delete');
            const id = '1234';

            const createQuery: ClientParams.CreateParams = {
                index: deleteIndex,
                id,
                body: { some: 'record', foo: 'bar' }
            };

            await client.createWithRetry(createQuery);

            const query: ClientParams.DeleteParams = {
                index: deleteIndex,
                id,
            };
            const response = await client.deleteWithRetry(query);

            expect(response).toBeDefined();

            const { _index, _id, result } = response;

            expect(_index).toEqual(deleteIndex);
            expect(_id).toEqual(id);
            expect(result).toEqual('deleted');
        });
    });

    describe('existsWithRetry', () => {
        it('should return valid results', async () => {
            const existsIndex = buildIndexName('exists');
            const id = '1234';

            const createQuery: ClientParams.CreateParams = {
                index: existsIndex,
                id,
                body: { some: 'record', foo: 'bar' }
            };

            await client.createWithRetry(createQuery);

            const query: ClientParams.ExistsParams = {
                index: existsIndex,
                id,
            };

            const response = await client.existsWithRetry(query);

            expect(response).toBeTrue();
        });
    });

    describe('getWithRetry', () => {
        it('should return valid results', async () => {
            const getIndex = buildIndexName('get');
            const id = '1234';
            interface TestRecord {
                some: string;
                foo: string;
            }
            const record = { some: 'record', foo: 'bar' };

            const createQuery: ClientParams.CreateParams = {
                index: getIndex,
                id,
                body: record
            };

            await client.createWithRetry(createQuery);

            const query: ClientParams.GetParams = {
                index: getIndex,
                id,
            };

            const response = await client.getWithRetry<TestRecord>(query);

            expect(response).toBeDefined();

            const { _index, _id, _source } = response;

            expect(_index).toEqual(getIndex);
            expect(_id).toEqual(id);
            expect(_source).toMatchObject(record);
            // this is mainly to show that types are being passed through
            expect(_source?.foo).toBeDefined();
        });
    });

    describe('mgetWithRetry', () => {
        it('should return valid results', async () => {
            const mgetIndex = buildIndexName('mget');
            const id1 = '1234';
            const id2 = '5678';

            const record1 = { some: 'record', foo: 'bar' };
            const record2 = { some: 'other', foo: 'baz' };

            const dataMap = new Map<string, Record<string, string>>();

            dataMap.set(id1, record1);
            dataMap.set(id2, record2);

            const createQuery1: ClientParams.CreateParams = {
                index: mgetIndex,
                id: id1,
                body: record1
            };

            const createQuery2: ClientParams.CreateParams = {
                index: mgetIndex,
                id: id2,
                body: record2
            };

            await Promise.all([
                client.createWithRetry(createQuery1),
                client.createWithRetry(createQuery2)
            ]);

            const query: ClientParams.MGetParams = {
                index: mgetIndex,
                body: { ids: [id1, id2] },
            };

            const response = await client.mgetWithRetry(query);

            expect(response).toBeDefined();
            expect(response.docs).toBeArrayOfSize(2);

            response.docs.forEach((doc) => {
                const {
                    _index, found, _source, _id
                } = doc;

                expect(_index).toEqual(mgetIndex);
                expect(found).toBeTrue();

                const expectedRecord = dataMap.get(_id) as Record<string, string>;
                expect(_source).toMatchObject(expectedRecord);
            });
        });
    });

    describe('putTemplateWithRetry', () => {
        it('should return valid results', async () => {
            const templatePattern = buildIndexName('');

            const query: ClientParams.IndicesPutTemplateParams = {
                name: 'some_name',
                body: {
                    index_patterns: [templatePattern],
                    mappings: {
                        dynamic: false,
                        properties: {
                            some: { type: 'keyword' },
                            foo: { type: 'keyword' },
                        }
                    }
                },
            };

            const response = await client.indices.putTemplate(query);

            expect(response).toBeDefined();
            expect(response.acknowledged).toBeTrue();
        });
    });

    describe('refreshWithRetry', () => {
        it('should return valid results', async () => {
            const query: ClientParams.IndicesRefreshParams = {
                index
            };
            const response = await client.indices.refresh(query);

            expect(response).toBeDefined();
        });
    });

    describe('recoveryWithRetry', () => {
        it('should return valid results', async () => {
            const query: ClientParams.IndicesRecoveryParams = {
                index
            };
            const response = await client.indices.recovery(query);

            expect(response).toBeDefined();
            expect(response[index]).toBeDefined();
        });
    });

    describe('isIndexAvailable', () => {
        it('should return when an index exists', async () => {
            await expect(async () => client.isIndexAvailable(index)).resolves.not.toThrow();
        });

        it('will return when a index is made', async () => {
            const secondIndex = buildIndexName('second');

            const query: ClientParams.SearchParams = {
                index: secondIndex,
                size: 0
            };

            async function delayCreation() {
                await pDelay(100);
                await client.indices.create({ index: secondIndex });
            }
            // throws because index does not exists yet
            await expect(async () => client.search(query)).rejects.toThrow();

            await expect(async () => Promise.all([
                client.isIndexAvailable(secondIndex),
                delayCreation()
            ])).resolves.not.toThrow();
        });
    });

    describe('setupIndex', () => {
        describe('mocked client tests', () => {
            it('can set up an index and wait for availability', async () => {
                const clusterName = 'teracluster';
                const newIndex = 'teracluster__state';
                const migrantIndexName = 'teracluster__state-v0.0.33';

                fakeClient.searchError = true;

                const testClient = new Client(fakeClient, clientMetadata);

                await expect(Promise.all([
                    waitFor(300, () => {
                        fakeClient.searchError = false;
                    }),
                    testClient.indices.setupIndex(
                        clusterName,
                        newIndex,
                        migrantIndexName,
                        template1
                    )
                ])).resolves.not.toThrow();
            });

            it('can wait for elasticsearch availability', async () => {
                const clusterName = 'teracluster';
                const newIndex = 'teracluster__state';
                const migrantIndexName = 'teracluster__state-v0.0.33';

                // this mimics an index not available to be searched as its not ready
                fakeClient.elasticDown = true;
                fakeClient.recoverError = true;

                const testClient = new Client(fakeClient, clientMetadata);

                await expect(Promise.all([
                    testClient.indices.setupIndex(
                        clusterName,
                        newIndex,
                        migrantIndexName,
                        template1,
                    ),
                    waitFor(1, () => {
                        fakeClient.elasticDown = false;
                    }),
                    waitFor(1200, () => {
                        fakeClient.recoverError = false;
                    })
                ])).resolves.not.toThrow();
            });

            it('can send template on state mapping changes, does not migrate', async () => {
                const clusterName = 'teracluster';
                const newIndex = 'teracluster__state';
                const migrantIndexName = 'teracluster__state-v0.0.33';

                fakeClient.changeMappings = true;

                const testClient = new Client(fakeClient, clientMetadata);

                await testClient.indices.setupIndex(
                    clusterName,
                    newIndex,
                    migrantIndexName,
                    template1
                );

                expect(fakeClient.putTemplateCalled).toEqual(true);
                expect(fakeClient.reindexCalled).toEqual(false);
            });

            it('can migrate on mapping changes', async () => {
                const clusterName = 'teracluster';
                const newIndex = 'teracluster__ex';
                const migrantIndexName = 'teracluster__ex-v0.0.33';

                fakeClient.changeMappings = true;
                fakeClient.isExecutionTemplate = true;

                const mapping = {
                    ...template1
                };

                unset(mapping, 'template');

                const testClient = new Client(fakeClient, clientMetadata);

                await testClient.indices.setupIndex(
                    clusterName,
                    newIndex,
                    migrantIndexName,
                    template1
                );
                expect(fakeClient.reindexCalled).toEqual(true);
                expect(fakeClient.indicesDeleteCalled).toEqual(true);
                expect(fakeClient.indicesPutAliasCalled).toEqual(true);
            });
        });
    });
});
