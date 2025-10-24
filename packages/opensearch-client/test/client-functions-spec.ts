import 'jest-extended';
import { debugLogger, cloneDeep, get } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { ClientParams, ClientResponse, FieldType } from '@terascope/types';
import { DataType } from '@terascope/data-types';
import {
    createClient, getBaseClient, Client,
    ElasticsearchTestHelpers,
} from '../src/index.js';

const {
    upload, populateIndex, cleanupIndex, waitForData,
    formatUploadData, getTestENVClientInfo,
    getTotalFormat, EvenDateData
} = ElasticsearchTestHelpers;

const { data, EvenDataType } = EvenDateData;

describe('creates client that exposes elasticsearch and opensearch functions', () => {
    const index = 'wrapped_client_test';
    const taskIndex = 'task_index_test';

    const testLogger = debugLogger('create-client-test');

    const {
        host,
        ...clientMetadata
    } = getTestENVClientInfo();

    const config = { node: host };

    let client: Client;

    beforeAll(async () => {
        ({ client } = await createClient(config, testLogger));

        Promise.all([
            cleanupIndex(client, index),
            cleanupIndex(client, taskIndex)
        ]);

        if (clientMetadata.version.split('.').length !== 3) {
            throw new Error(`Expected version to follow semver format (major.minor.patch) got ${clientMetadata.version}`);
        }

        await upload(client, { index }, data);
        await waitForData(client, index, 1000);
    }, 15000);

    describe('info', () => {
        it('should return info about the cluster', async () => {
            const resp = await client.info();

            if (clientMetadata.distribution === 'elasticsearch') {
                expect(resp.cluster_name).toBe('docker-cluster');
            }

            if (clientMetadata.distribution === 'opensearch') {
                expect(resp.cluster_name).toBe('docker-cluster');
                expect(resp.version.distribution).toBe('opensearch');
            }

            expect(resp.version.number).toBe(clientMetadata.version);
        });

        it('should throw an error if tried on a non-supported distribution', async () => {
            const badVersion = cloneDeep(clientMetadata);

            badVersion.version = '4.2.1';
            badVersion.majorVersion = 4;
            badVersion.minorVersion = 2;

            const badDistribution = new Client(client, badVersion);

            await expect(() => badDistribution.ping()).rejects.toThrow(`Unsupported ${clientMetadata.distribution} version: 4.2.1`);
        });
    });

    describe('ping', () => {
        it('should return true if cluster is running', async () => {
            const resp = await client.ping();

            expect(resp).toBe(true);
        });

        it('should throw an error if tried on a non-supported distribution', async () => {
            const badVersion = cloneDeep(clientMetadata);

            badVersion.version = '10.0.0';
            badVersion.majorVersion = 10;
            badVersion.minorVersion = 0;

            const badDistribution = new Client(client, badVersion);

            await expect(() => badDistribution.ping()).rejects.toThrow(`Unsupported ${clientMetadata.distribution} version: 10.0.0`);
        });
    });

    describe('count', () => {
        it('can return how many match a query', async () => {
            const response = await client.count({ index });

            expect(response).toBeObject();
            expect(response).toHaveProperty('count');
            expect(response).toMatchObject({ count: 1000 });
        });

        it('can convert params of other version to be compatible', async () => {
            // has type, should be removed in Elasticsearch v8 tests
            const bodyTypeQuery: ClientParams.CountParams = {
                index,
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                wildcard: {
                                    uuid: 'bedb2b6e*'
                                }
                            }
                        }
                    }
                },
            };

            const response = await client.count(bodyTypeQuery);
            expect(response).toMatchObject({ count: 1 });
        });
    });

    describe('bulk', () => {
        const testIndex = `${index}_bulk_index`;

        afterAll(async () => {
            await cleanupIndex(client, testIndex);
        });

        it('can send records to an index', async () => {
            const bulkData = formatUploadData(testIndex, data);

            const request: ClientParams.BulkParams = {
                index: testIndex,
                refresh: 'wait_for',
                body: bulkData
            };

            const response = await client.bulk(request);

            expect(response).toHaveProperty('took');
            expect(response).toHaveProperty('errors', false);
            expect(response).toHaveProperty('items');
            expect(response.items).toBeArrayOfSize(1000);

            // we will wait for 10s for bulk data before throwing
            await waitForData(client, testIndex, 1000, 10000);
        });
    });

    describe('create', () => {
        const createIndex = `${index}_create`;
        const record = {
            hello: 'there',
            num: 28343
        };

        const recordID = '12341234';

        beforeAll(async () => {
            await cleanupIndex(client, createIndex);
        });

        afterAll(async () => {
            await cleanupIndex(client, createIndex);
        });

        it('can create a new record and index', async () => {
            const bodyTypeQuery: ClientParams.CreateParams = {
                index: createIndex,
                refresh: true,
                id: recordID,
                body: record
            };

            const response = await client.create(bodyTypeQuery);

            expect(response).toHaveProperty('_index', createIndex);
            expect(response).toHaveProperty('_id', recordID);
            expect(response).toHaveProperty('_version');
            expect(response).toHaveProperty('result', 'created');
            expect(response).toHaveProperty('_shards');
            expect(response).toHaveProperty('_seq_no');
            expect(response).toHaveProperty('_primary_term');
        });
    });

    describe('index', () => {
        const testIndex = `${index}_index_method`;

        afterAll(async () => {
            await cleanupIndex(client, testIndex);
        });

        it('can index a new record', async () => {
            const doc = {
                some: 'newThing',
                bool: true,
                obj: { other: 'thing' }
            };

            const query: ClientParams.IndexParams = {
                index: testIndex,
                refresh: 'wait_for',
                body: doc
            };

            const response = await client.index(query);

            expect(response).toHaveProperty('_index', testIndex);
            expect(response).toHaveProperty('_id');
            expect(response).toHaveProperty('_version', 1);
            expect(response).toHaveProperty('result', 'created');
            expect(response).toHaveProperty('_shards');
            expect(response).toHaveProperty('_seq_no');

            // make sure record exists
            await waitForData(client, testIndex, 1, 10000);
        });
    });

    describe('update', () => {
        const testIndex = `${index}_update_method`;

        const doc = {
            some: 'newThing',
            bool: true,
            obj: { other: 'thing' },
            method: 'update'
        };
        const id1 = '123412341234';
        const id2 = '123412341235';

        const records = [
            DataEntity.make(doc, { _key: id1 }),
            DataEntity.make(doc, { _key: id2 }),
        ];

        const dataType = new DataType({
            fields: {
                some: { type: FieldType.String },
                bool: { type: FieldType.Boolean },
                obj: { type: FieldType.Object },
                method: { type: FieldType.String },
            }
        });

        beforeAll(async () => {
            // use this to test the function, this ensure a type for a given field
            await populateIndex(
                client, testIndex, dataType, records
            );
        });

        afterAll(async () => {
            await cleanupIndex(client, testIndex);
        });

        it('can update a new record', async () => {
            const updatedDoc = {
                wasUpdated: true
            };

            const query: ClientParams.UpdateParams = {
                id: id1,
                index: testIndex,
                body: { doc: updatedDoc },
                refresh: true
            };

            const response = await client.update(query);

            expect(response).toHaveProperty('_index', testIndex);
            expect(response).toHaveProperty('_id', id1);
            expect(response).toHaveProperty('_version', 2);
            expect(response).toHaveProperty('result', 'updated');
            expect(response).toHaveProperty('forced_refresh', true);
            expect(response).toHaveProperty('_shards');
            expect(response).toHaveProperty('_seq_no');
        });

        it('can update a new record without a type', async () => {
            const updatedDoc = {
                iLoveUpdates: true
            };

            const query: ClientParams.UpdateParams = {
                id: id2,
                index: testIndex,
                body: { doc: updatedDoc },
                refresh: true
            };

            const response = await client.update(query);

            expect(response).toHaveProperty('_index', testIndex);
            expect(response).toHaveProperty('_id', id2);
            expect(response).toHaveProperty('_version', 2);
            expect(response).toHaveProperty('result', 'updated');
            expect(response).toHaveProperty('forced_refresh', true);
            expect(response).toHaveProperty('_shards');
            expect(response).toHaveProperty('_seq_no');
        });
    });

    describe('delete', () => {
        const deleteIndex = `${index}_delete`;

        beforeAll(async () => {
            await cleanupIndex(client, deleteIndex);
            await upload(client, { index: deleteIndex }, data);
            await waitForData(client, deleteIndex, 1000);
        });

        afterAll(async () => {
            await cleanupIndex(client, deleteIndex);
        });

        it('can delete a single records', async () => {
            const bodyTypeQuery: ClientParams.DeleteParams = {
                index: deleteIndex,
                id: '3849b210-d8b8-4708-b70d-90b043a2598d'
            };

            const response = await client.delete(bodyTypeQuery);

            expect(response).toHaveProperty('_index', deleteIndex);
            expect(response).toHaveProperty('_id', '3849b210-d8b8-4708-b70d-90b043a2598d');
            expect(response).toHaveProperty('_version');
            expect(response).toHaveProperty('result', 'deleted');
            expect(response).toHaveProperty('_shards');
            expect(response).toHaveProperty('_seq_no');
            expect(response).toHaveProperty('_primary_term');
        });
    });

    describe('deleteByQuery', () => {
        const deleteByQueryIndex = `${index}_delete_by_query`;

        beforeAll(async () => {
            await cleanupIndex(client, deleteByQueryIndex);
            await upload(client, { index: deleteByQueryIndex }, data);
            await waitForData(client, deleteByQueryIndex, 1000);
        });

        afterAll(async () => {
            await cleanupIndex(client, deleteByQueryIndex);
        });

        it('can delete multiple records by query', async () => {
            const bodyTypeQuery: ClientParams.DeleteByQueryParams = {
                index: deleteByQueryIndex,
                refresh: true,
                body: {
                    query: {
                        constant_score: {
                            filter: {
                                wildcard: {
                                    uuid: 'b*'
                                }
                            }
                        }
                    }
                },
            };

            const response = await client.deleteByQuery(bodyTypeQuery);

            expect(response).toHaveProperty('took');
            expect(response).toHaveProperty('total', 406);
            expect(response).toHaveProperty('deleted', 406);
            expect(response).toHaveProperty('version_conflicts', 0);
            expect(response).toHaveProperty('failures', []);
        });

        it('can delete multiple records by query without body present', async () => {
            const bodyTypeQuery: ClientParams.DeleteByQueryParams = {
                index: deleteByQueryIndex,
                refresh: true,
                q: 'uuid:c*'
            };

            const response = await client.deleteByQuery(bodyTypeQuery);

            expect(response).toHaveProperty('took');
            expect(response).toHaveProperty('total', 120);
            expect(response).toHaveProperty('deleted', 120);
            expect(response).toHaveProperty('version_conflicts', 0);
            expect(response).toHaveProperty('failures', []);
        });
    });

    describe('get', () => {
        const record = {
            ip: '83.45.7.13',
            userAgent: 'Mozilla/5.0 (Windows; U; Windows NT 5.2) AppleWebKit/531.2.1 (KHTML, like Gecko) Chrome/22.0.871.0 Safari/531.2.1',
            url: 'https://taryn.com',
            uuid: '89ae57fc-134c-4f21-8e7a-e1a9831b9a17',
            created: '2019-04-26T15:00:23.349+00:00',
            ipv6: '51d0:b32a:552d:efdc:8b14:8a7a:e987:fa65',
            location: '-9.86151, -18.90292',
            bytes: 636257
        };

        it('can fetch a record', async () => {
            const bodyTypeQuery: ClientParams.GetParams = {
                index,
                id: record.uuid,
            };

            const response = await client.get(bodyTypeQuery);

            expect(response).toHaveProperty('_index', index);
            expect(response).toHaveProperty('_id', record.uuid);
            expect(response).toHaveProperty('found', true);
            expect(response._source).toMatchObject(record);
        });

        it('records returned can have removed fields', async () => {
            const bodyTypeQuery: ClientParams.GetParams = {
                index,
                id: record.uuid,
                _source_excludes: ['location', 'ipv6', 'userAgent']
            };

            const {
                location, ipv6, userAgent, ...parsedRecord
            } = record;

            const response = await client.get(bodyTypeQuery);

            expect(response).toHaveProperty('_index', index);
            expect(response).toHaveProperty('_id', record.uuid);
            expect(response).toHaveProperty('found', true);
            expect(response._source).toMatchObject(parsedRecord);
        });
    });

    describe('mget', () => {
        const mgetIndex = 'test-mget';

        beforeAll(async () => {
            const testData = data.slice(0, 10)
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            await cleanupIndex(client, mgetIndex);
            await populateIndex(
                client, mgetIndex, EvenDataType, testData
            );
            await waitForData(client, mgetIndex, 10);
        });

        afterAll(async () => {
            await cleanupIndex(client, mgetIndex);
        });

        it('should handle docs in body property', async () => {
            const params = {
                index: mgetIndex,
                body: {
                    docs:
                        [
                            { _index: mgetIndex, _id: '1' },
                            { _index: mgetIndex, _id: '7' },
                            { _index: mgetIndex, _id: '4' }
                        ]
                }
            };

            const resp = await client.mget(params) as any;

            expect(resp.docs[0]._source?.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
            expect(resp.docs[1]._source?.uuid).toBe('b284b6c9-43bb-4c59-a4e4-fdb17b004300');
            expect(resp.docs[2]._source?.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
        });

        it('should handle ids in body property', async () => {
            const params = {
                index: mgetIndex,
                body: {
                    ids: ['1', '7', '4']
                }
            };

            const resp = await client.mget(params) as any;

            expect(resp.docs.length).toBe(3);
            expect(resp.docs[0]._source?.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
            expect(resp.docs[1]._source?.uuid).toBe('b284b6c9-43bb-4c59-a4e4-fdb17b004300');
            expect(resp.docs[2]._source?.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
        });

        it('should handle ids in body property with type', async () => {
            const params = {
                index: mgetIndex,
                body: {
                    ids: ['1', '7', '4']
                }
            };

            const resp = await client.mget(params) as any;

            expect(resp.docs.length).toBe(3);
            expect(resp.docs[0]._source?.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
            expect(resp.docs[1]._source?.uuid).toBe('b284b6c9-43bb-4c59-a4e4-fdb17b004300');
            expect(resp.docs[2]._source?.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
        });
    });

    describe('search', () => {
        const searchIndex = 'test-search';

        const total = getTotalFormat(clientMetadata.distribution, clientMetadata.majorVersion, 1);

        beforeAll(async () => {
            const testData = data.slice(0, 10)
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            await cleanupIndex(client, searchIndex);

            await populateIndex(
                client, searchIndex, EvenDataType, testData
            );

            await waitForData(client, searchIndex, 10);
        });

        afterAll(async () => {
            await cleanupIndex(client, searchIndex);
        });

        it('should return record on q search', async () => {
            const params = {
                index: searchIndex,
                q: 'uuid:bea4086e-6f2e-4f4b-a1bf-c20330f92e8c'
            };

            const resp = await client.search(params);

            expect(resp.hits.total).toEqual(total);

            expect(resp.hits.hits[0]._source).toEqual({
                ip: '143.174.175.238',
                userAgent: 'Mozilla/5.0 (Windows; U; Windows NT 6.3) AppleWebKit/531.0.0 (KHTML, like Gecko) Chrome/22.0.897.0 Safari/531.0.0',
                url: 'http://dedrick.biz',
                uuid: 'bea4086e-6f2e-4f4b-a1bf-c20330f92e8c',
                created: '2019-04-26T15:00:23.213+00:00',
                ipv6: '5b2a:9397:6e8c:ac74:63a0:799c:00b5:92d2',
                location: '88.04393, -35.42878',
                bytes: 188644
            });
        });

        it('should return record with type and index in search', async () => {
            const params = {
                index: searchIndex,
                q: 'uuid:bea4086e-6f2e-4f4b-a1bf-c20330f92e8c'
            };

            const resp = await client.search(params);

            expect(resp.hits.total).toEqual(total);
            expect(resp.hits.hits[0]._source).toEqual({
                ip: '143.174.175.238',
                userAgent: 'Mozilla/5.0 (Windows; U; Windows NT 6.3) AppleWebKit/531.0.0 (KHTML, like Gecko) Chrome/22.0.897.0 Safari/531.0.0',
                url: 'http://dedrick.biz',
                uuid: 'bea4086e-6f2e-4f4b-a1bf-c20330f92e8c',
                created: '2019-04-26T15:00:23.213+00:00',
                ipv6: '5b2a:9397:6e8c:ac74:63a0:799c:00b5:92d2',
                location: '88.04393, -35.42878',
                bytes: 188644
            });
        });

        it('should return record with body search', async () => {
            const params = {
                index: searchIndex,
                body: {
                    query: {
                        match: {
                            uuid: 'bea4086e-6f2e-4f4b-a1bf-c20330f92e8c'
                        }
                    }
                }
            };

            const resp = await client.search(params);

            expect(resp.hits.total).toEqual(total);
            expect(resp.hits.hits[0]._source).toEqual({
                ip: '143.174.175.238',
                userAgent: 'Mozilla/5.0 (Windows; U; Windows NT 6.3) AppleWebKit/531.0.0 (KHTML, like Gecko) Chrome/22.0.897.0 Safari/531.0.0',
                url: 'http://dedrick.biz',
                uuid: 'bea4086e-6f2e-4f4b-a1bf-c20330f92e8c',
                created: '2019-04-26T15:00:23.213+00:00',
                ipv6: '5b2a:9397:6e8c:ac74:63a0:799c:00b5:92d2',
                location: '88.04393, -35.42878',
                bytes: 188644
            });
        });
    });

    describe('msearch', () => {
        const msearchIndex = 'test-msearch';

        const total = getTotalFormat(clientMetadata.distribution, clientMetadata.majorVersion, 1);

        beforeAll(async () => {
            const testData = data.slice(0, 10)
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            await cleanupIndex(client, msearchIndex);

            await populateIndex(
                client, msearchIndex, EvenDataType, testData
            );

            await waitForData(client, msearchIndex, 10);
        });

        afterAll(async () => {
            await cleanupIndex(client, msearchIndex);
        });

        it('should return requested records', async () => {
            const params = {
                index: msearchIndex,
                body: [
                    { index: msearchIndex },
                    { query: { match: { uuid: 'bd920141-45b3-41fd-8eea-b1640a2fa3d2' } } },
                    { index: msearchIndex },
                    { query: { match: { uuid: 'b23a8550-0081-453f-9e80-93a90782a5bd' } } }
                ]
            };

            const resp = await client.msearch(params);

            expect(resp.responses.length).toBe(2);

            expect(resp.responses[0].hits.total).toEqual(total);
            expect(resp.responses[0].hits.hits[0]._source?.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
            expect(resp.responses[1].hits.total).toEqual(total);
            expect(resp.responses[1].hits.hits[0]._source?.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
        });

        it('should handle type in params and return requested records', async () => {
            const params = {
                index: msearchIndex,
                body: [
                    { index: msearchIndex },
                    { query: { match: { uuid: 'bd920141-45b3-41fd-8eea-b1640a2fa3d2' } } },
                    { index: msearchIndex },
                    { query: { match: { uuid: 'b23a8550-0081-453f-9e80-93a90782a5bd' } } }
                ]
            };

            const resp = await client.msearch(params);

            expect(resp.responses.length).toBe(2);

            expect(resp.responses[0].hits.total).toEqual(total);
            expect(resp.responses[0].hits.hits[0]._source?.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
            expect(resp.responses[1].hits.total).toEqual(total);
            expect(resp.responses[1].hits.hits[0]._source?.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
        });

        it('should handle ccs_minimize_roundtrips in params and return requested records', async () => {
            const params = {
                index: msearchIndex,
                ccs_minimize_roundtrips: true,
                body: [
                    { index: msearchIndex },
                    { query: { match: { uuid: 'bd920141-45b3-41fd-8eea-b1640a2fa3d2' } } },
                    { index: msearchIndex },
                    { query: { match: { uuid: 'b23a8550-0081-453f-9e80-93a90782a5bd' } } }
                ]
            };

            const resp = await client.msearch(params);

            expect(resp.responses.length).toBe(2);

            expect(resp.responses[0].hits.total).toEqual(total);
            expect(resp.responses[0].hits.hits[0]._source?.uuid).toBe('bd920141-45b3-41fd-8eea-b1640a2fa3d2');
            expect(resp.responses[1].hits.total).toEqual(total);
            expect(resp.responses[1].hits.hits[0]._source?.uuid).toBe('b23a8550-0081-453f-9e80-93a90782a5bd');
        });
    });

    describe('exists', () => {
        const existsIndex = 'test-exists';

        beforeAll(async () => {
            const testData = data.slice(0, 1)
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            await cleanupIndex(client, existsIndex);

            await upload(client, { index: existsIndex }, testData);
            await waitForData(client, existsIndex, 1);
        });

        afterAll(async () => {
            await cleanupIndex(client, existsIndex);
        });

        it('should return true if the record exists', async () => {
            const params = {
                id: '1',
                index: existsIndex
            };

            const resp = await client.exists(params);

            expect(resp).toBe(true);
        });

        it('should return false if the record does not exist', async () => {
            const params = {
                id: '2',
                index: existsIndex
            };

            const resp = await client.exists(params);

            expect(resp).toBe(false);
        });

        it('should return response with complex params', async () => {
            const params = {
                id: '1',
                index: existsIndex,

                preference: '_local',
                realtime: true,
                refresh: false,
                routing: '1'
            };

            const resp = await client.exists(params);

            expect(resp).toBe(true);
        });
    });

    describe('reindex', () => {
        const reindexIndex = 'test-reindex';

        const testIndices = [
            'test-reindex2',
            'test-reindex3',
            'test-reindex4',
            'test-reindex5',
            'test-reindex6'
        ];

        beforeAll(async () => {
            const testData = data.slice(0, 10)
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            await cleanupIndex(client, reindexIndex);

            await populateIndex(
                client, reindexIndex, EvenDataType, testData
            );

            await waitForData(client, reindexIndex, 10);
        });

        afterAll(async () => {
            await cleanupIndex(client, reindexIndex);
            await Promise.all(testIndices.map((i) => cleanupIndex(client, i)));
        });

        it('should reindex test index', async () => {
            const params = {
                body: {
                    source: {
                        index: reindexIndex
                    },
                    dest: {
                        index: 'test-reindex2'
                    }
                }
            };

            const resp = await client.reindex(params) as ClientResponse.ReindexCompletedResponse;

            expect(resp.total).toBe(10);
            expect(resp.created).toBe(10);
            expect(resp.failures.length).toBe(0);
        });

        it('should handle types in reindex params', async () => {
            const params = {
                body: {
                    source: {
                        index: reindexIndex
                    },
                    dest: {
                        index: 'test-reindex3',

                    }
                }
            };

            const resp = await client.reindex(params) as ClientResponse.ReindexCompletedResponse;

            expect(resp.total).toBe(10);
            expect(resp.created).toBe(10);
            expect(resp.failures.length).toBe(0);
        });

        it('should handle a script in reindex params', async () => {
            const params: ClientParams.ReindexParams = {
                body: {
                    source: {
                        index: reindexIndex
                    },
                    dest: {
                        index: 'test-reindex4',

                    },
                    script: {
                        source: 'ctx._source.host = ctx._source.remove("url")',
                        lang: 'painless'
                    }
                }
            };

            const resp = await client.reindex(params) as ClientResponse.ReindexCompletedResponse;

            expect(resp.total).toBe(10);
            expect(resp.created).toBe(10);
            expect(resp.failures.length).toBe(0);
        });

        it('should handle a query in source params', async () => {
            const params = {
                body: {
                    source: {
                        index: reindexIndex,
                        query: { match: { uuid: 'bd920141-45b3-41fd-8eea-b1640a2fa3d2' } }
                    },
                    dest: {
                        index: 'test-reindex6',

                    }
                }
            };

            const resp = await client.reindex(params) as ClientResponse.ReindexCompletedResponse;

            expect(resp.total).toBe(1);
            expect(resp.created).toBe(1);
            expect(resp.failures.length).toBe(0);
        });

        it('should handle additional reindex params', async () => {
            const params: ClientParams.ReindexParams = {
                refresh: true,
                max_docs: 5,
                wait_for_active_shards: 1,
                requests_per_second: 100,
                body: {
                    conflicts: 'proceed',
                    source: {
                        index: reindexIndex,
                        _source: ['url', 'ip', 'created', 'userAgent']
                    },
                    dest: {
                        index: 'test-reindex5',
                        op_type: 'create'
                    }
                }
            };

            const resp = await client.reindex(params) as ClientResponse.ReindexCompletedResponse;

            if (clientMetadata.distribution === 'elasticsearch') {
                expect(resp.total).toBe(5);
                expect(resp.created).toBe(5);
            }
        });
    });

    describe('cluster.getSettings', () => {
        it('can fetch settings from the cluster', async () => {
            const response = await client.cluster.getSettings();

            expect(response).toHaveProperty('persistent');
            expect(response).toHaveProperty('transient');
        });
    });

    describe('cluster.health', () => {
        it('can fetch the health of the cluster', async () => {
            const response = await client.cluster.health();

            expect(response).toHaveProperty('cluster_name');
            expect(response).toHaveProperty('status');
            expect(response).toHaveProperty('timed_out', false);
            expect(response).toHaveProperty('number_of_nodes');
            expect(response).toHaveProperty('number_of_data_nodes');
            expect(response).toHaveProperty('active_primary_shards');
            expect(response).toHaveProperty('active_shards');
            expect(response).toHaveProperty('number_of_pending_tasks');
            expect(response).toHaveProperty('number_of_in_flight_fetch');
            expect(response).toHaveProperty('task_max_waiting_in_queue_millis');
        });
    });

    describe('cat.indices', () => {
        it('can print out the indices status', async () => {
            const response = await client.cat.indices();

            expect(typeof response).toEqual('string');
            expect(response).toInclude(index);
            // the size of the index
            expect(response).toInclude('1000');
        });
    });

    describe('nodes.info', () => {
        it('can fetch info from the nodes', async () => {
            const response = await client.nodes.info();

            expect(response).toHaveProperty('cluster_name');
            expect(response).toHaveProperty('_nodes');
            expect(response).toHaveProperty('nodes');
            expect(response.nodes).toBeObject();

            const node = Object.values(response.nodes)[0];

            expect(node).toHaveProperty('name');
            expect(node).toHaveProperty('host');
            expect(node).toHaveProperty('ip');
            expect(node).toHaveProperty('version');
            expect(node).toHaveProperty('roles');
            expect(node).toHaveProperty('settings');
            expect(node).toHaveProperty('process');
            expect(node).toHaveProperty('jvm');
            expect(node).toHaveProperty('thread_pool');
            expect(node).toHaveProperty('modules');
        });
    });

    describe('nodes.stats', () => {
        it('can fetch stats from the nodes', async () => {
            const response = await client.nodes.stats();

            expect(response).toHaveProperty('cluster_name');
            expect(response).toHaveProperty('_nodes');
            expect(response).toHaveProperty('nodes');
            expect(response.nodes).toBeObject();

            const node = Object.values(response.nodes)[0];

            expect(node).toHaveProperty('name');
            expect(node).toHaveProperty('timestamp');
            expect(node).toHaveProperty('host');
            expect(node).toHaveProperty('ip');
            expect(node).toHaveProperty('roles');
            expect(node).toHaveProperty('indices');
            expect(node).toHaveProperty('indices.docs.count');
            expect(node).toHaveProperty('os');
            expect(node).toHaveProperty('process');
            expect(node).toHaveProperty('jvm');
        });
    });

    describe('indices.get', () => {
        const testIndex = 'test-indices-get';

        beforeAll(async () => {
            const testData = data.slice(0, 1)
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            await cleanupIndex(client, testIndex);

            await upload(client, { index: testIndex }, testData);
            await waitForData(client, testIndex, 1);
        });

        afterAll(async () => {
            await cleanupIndex(client, testIndex);
        });

        it('should return mappings and settings for the index', async () => {
            const params = {
                index: testIndex
            };

            const resp = await client.indices.get(params);

            expect(resp).toHaveProperty(testIndex);
            expect(resp[testIndex]).toHaveProperty('settings');
            expect(resp[testIndex]).toHaveProperty('mappings');
        });

        it('should return mappings and settings for multiple indices', async () => {
            const index2 = 'test-indices-get2';

            const testData = data.slice(0, 1)
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            await upload(client, { index: index2 }, testData);

            const params = {
                index: 'test-indices-g*'
            };

            const resp = await client.indices.get(params);

            expect(resp).toHaveProperty(testIndex);
            expect(resp[testIndex]).toHaveProperty('settings');
            expect(resp[testIndex]).toHaveProperty('mappings');

            expect(resp).toHaveProperty(index2);
            expect(resp[index2]).toHaveProperty('settings');
            expect(resp[index2]).toHaveProperty('mappings');
        });

        it('should handle detailed settings and mappings and settings for the index', async () => {
            const params: ClientParams.IndicesGetParams = {
                index: testIndex,
                local: true,
                ignore_unavailable: true,
                allow_no_indices: true,
                expand_wildcards: 'none',
                flat_settings: true,
                include_defaults: true,
                master_timeout: '60s'
            };

            const resp = await client.indices.get(params);

            expect(resp).toHaveProperty(testIndex);
            expect(resp[testIndex]).toHaveProperty('settings');
            expect(resp[testIndex]).toHaveProperty('mappings');
        });
    });

    describe('indices.exists', () => {
        const testIndex = 'test-indices-exists';
        const anotherIndex = 'test-indices-exists2';

        beforeAll(async () => {
            const testData = data.slice(0, 1)
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            await cleanupIndex(client, testIndex);
            await cleanupIndex(client, anotherIndex);

            await upload(client, { index: testIndex }, testData);
            await upload(client, { index: anotherIndex }, testData);
            await waitForData(client, testIndex, 1);
        });

        afterAll(async () => {
            await Promise.all([
                cleanupIndex(client, testIndex),
                cleanupIndex(client, anotherIndex)
            ]);
        });

        it('should return true is index exists', async () => {
            const params = {
                index: testIndex
            };

            const resp = await client.indices.exists(params);

            expect(resp).toBeTrue();
        });

        it('should return true if index exists with parameters', async () => {
            const params: ClientParams.IndicesExistsParams = {
                index: testIndex,
                allow_no_indices: false,
                expand_wildcards: 'open',
                flat_settings: true,
                include_defaults: true,
                ignore_unavailable: true,
                local: true
            };

            const resp = await client.indices.exists(params);

            expect(resp).toBeTrue();
        });

        it('should return true if all indices exist', async () => {
            const params: ClientParams.IndicesExistsParams = {
                index: [testIndex, anotherIndex],
                allow_no_indices: false,
                expand_wildcards: 'open',
                flat_settings: true,
                include_defaults: true,
                ignore_unavailable: true,
                local: true
            };

            const resp = await client.indices.exists(params);

            expect(resp).toBeTrue();
        });
    });

    describe('indices.stats', () => {
        const testIndex = 'test-indices-stats';

        beforeAll(async () => {
            const testData = data.slice(0, 5)
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            await cleanupIndex(client, testIndex);

            await upload(client, { index: testIndex }, testData);
            await waitForData(client, testIndex, 5);
        });

        afterAll(async () => {
            await cleanupIndex(client, testIndex);
        });

        it('should return stats on the index', async () => {
            const params = { index: testIndex };

            const resp = await client.indices.stats(params);

            expect(resp._shards).toBeDefined();
            expect(resp._all).toBeDefined();
            expect(resp._all.total.docs?.count).toBe(5);
        });
    });

    describe('indices.create', () => {
        const testIndex = 'test-indices-create';
        const otherIndex = 'test-indices-create-with-settings-type';
        const anotherIndex = 'test-indices-create-with-settings';

        afterAll(async () => {
            await Promise.all([
                cleanupIndex(client, testIndex),
                cleanupIndex(client, otherIndex),
                cleanupIndex(client, anotherIndex),
            ]);
        });

        it('should create new index', async () => {
            const params = {
                index: testIndex
            };

            const resp = await client.indices.create(params);

            expect(resp.acknowledged).toBeTrue();
            expect(resp.shards_acknowledged).toBeTrue();
            expect(resp.index).toBe(testIndex);
        });

        it('should create new index with mappings, alias, and settings without types', async () => {
            const params = {
                index: anotherIndex,
                body: {
                    aliases: {
                        'test-indices-yo-mama2': {
                            is_write_index: true,
                            is_hidden: false
                        }
                    },
                    mappings: {
                        properties: {
                            _key: { type: 'keyword' },
                            name: { type: 'text' },
                            age: { type: 'short' }
                        }
                    },
                    settings: {
                        number_of_shards: 3,
                        number_of_replicas: 2,
                        max_result_window: 10
                    }
                }
            };

            const resp = await client.indices.create(params);

            expect(resp.acknowledged).toBeTrue();
            expect(resp.shards_acknowledged).toBeTrue();
            expect(resp.index).toBe(anotherIndex);
        });
    });

    describe('indices.delete', () => {
        const testIndex = 'test-indices-delete';

        beforeAll(async () => {
            const testData = data.slice(0, 1)
                .map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

            await cleanupIndex(client, testIndex);

            await upload(client, { index: testIndex }, testData);
            await waitForData(client, testIndex, 1);
        });

        afterAll(async () => {
            await cleanupIndex(client, testIndex);
        });

        it('should delete the index', async () => {
            const params = {
                index: testIndex
            };

            const resp = await client.indices.delete(params);

            expect(resp.acknowledged).toBeTrue();
        });
    });

    describe('indices.putTemplate', () => {
        const tempName = 'test-template-put';

        afterAll(async () => {
            await client.indices.deleteTemplate({ name: tempName });
        });

        it('should save the template to the cluster', async () => {
            const params: ClientParams.IndicesPutTemplateParams = {
                name: tempName,
                order: 0,
                create: true,
                master_timeout: '60s',
                body: {
                    index_patterns: ['test-put-template'],
                    settings: {
                        number_of_shards: 3,
                        number_of_replicas: 2
                    },
                    mappings: {
                        properties: {
                            name: { type: 'keyword' },
                            uuid: { type: 'keyword' },
                            created: { type: 'date' }
                        }
                    },
                    aliases: {
                        template_test: {}
                    }
                }
            };

            const resp = await client.indices.putTemplate(params);

            expect(resp.acknowledged).toBeTrue();
        });
    });

    describe('indices.getTemplate', () => {
        const tempName = 'test-template-get';

        const settings = {
            number_of_shards: '3',
            number_of_replicas: '2'
        };

        const mappings = {
            properties: {
                name: { type: 'keyword' },
                uuid: { type: 'keyword' },
                created: { type: 'date' }
            }
        };

        const indexPatterns = ['test-template-get*'];

        const aliases = { template_test: {} };

        beforeAll(async () => {
            await client.indices.putTemplate({
                name: tempName,
                body: {
                    index_patterns: indexPatterns,
                    settings,
                    mappings,
                    aliases
                }
            });
        });

        afterAll(async () => {
            await client.indices.deleteTemplate({ name: tempName });
        });

        it('should return template', async () => {
            const params: ClientParams.IndicesGetTemplateParams = {
                name: tempName,
                master_timeout: '60s',
                local: false,
                flat_settings: false
            };

            const resp = await client.indices.getTemplate(params);

            expect(resp).toEqual({
                [tempName]: {
                    order: 0,
                    index_patterns: indexPatterns,
                    settings: { index: settings },
                    mappings,
                    aliases
                }
            });
        });
    });

    describe('indices.deleteTemplate', () => {
        const tempName = 'test-template-delete';

        beforeAll(async () => {
            await client.indices.putTemplate({
                name: tempName,
                body: {
                    index_patterns: ['test-delete-template'],
                    settings: {
                        number_of_shards: 3,
                        number_of_replicas: 2
                    },
                    mappings: {
                        properties: {
                            name: { type: 'keyword' },
                            uuid: { type: 'keyword' },
                            created: { type: 'date' }
                        }
                    },
                    aliases: {
                        template_test: {}
                    }
                }
            });
        });

        it('should delete the template', async () => {
            const params: ClientParams.IndicesDeleteTemplateParams = {
                name: tempName,
                master_timeout: '60s'
            };

            const resp = await client.indices.deleteTemplate(params);

            expect(resp.acknowledged).toBeTrue();
        });
    });

    describe('indices.existsTemplate', () => {
        const tempName = 'test-template-exists';

        beforeAll(async () => {
            await client.indices.putTemplate({
                name: tempName,
                body: {
                    index_patterns: ['test-template-exists*'],
                    settings: {
                        number_of_shards: 3,
                        number_of_replicas: 2
                    },
                    mappings: {
                        properties: {
                            name: { type: 'keyword' },
                            uuid: { type: 'keyword' },
                            created: { type: 'date' }
                        }
                    },
                    aliases: {
                        template_test: {}
                    }
                }
            });
        });

        afterAll(async () => {
            await client.indices.deleteTemplate({ name: tempName });
        });

        it('should return true if template exists', async () => {
            const params: ClientParams.IndicesExistsTemplateParams = {
                name: tempName,
                master_timeout: '60s',
                local: false,
                flat_settings: false
            };

            const resp = await client.indices.existsTemplate(params);

            expect(resp).toBeTrue();
        });

        it('should return false if template does not exist', async () => {
            const params: ClientParams.IndicesExistsTemplateParams = {
                name: 'not-exists',
                master_timeout: '60s',
                local: false,
                flat_settings: false
            };

            const resp = await client.indices.existsTemplate(params);

            expect(resp).toBeFalse();
        });
    });

    describe('indices.getIndexTemplate', () => {
        const tempName = 'test-template-get';

        const settings = {
            number_of_shards: '3',
            number_of_replicas: '2'
        };

        const mappings = {
            properties: {
                name: { type: 'keyword' },
                uuid: { type: 'keyword' },
                created: { type: 'date' }
            }
        };

        const indexPatterns = ['test-template-get*'];

        const aliases = { template_test: {} };
        let newClient: any;

        beforeAll(async () => {
            newClient = await getBaseClient(
                clientMetadata,
                { node: host },
                testLogger
            );

            if (clientMetadata.majorVersion !== 6) {
                await newClient.indices.putIndexTemplate({
                    name: tempName,
                    body: {
                        index_patterns: indexPatterns,
                        template: {
                            settings,
                            mappings,
                            aliases
                        }
                    }
                });
            }
        });

        afterAll(async () => {
            if (clientMetadata.majorVersion !== 6) {
                await newClient.indices.deleteIndexTemplate({ name: tempName });
            }
        });

        it('should return template', async () => {
            const params = {
                name: tempName
            };

            if (clientMetadata.majorVersion !== 6) {
                const resp = await client.indices.getIndexTemplate(params);

                expect(resp).toEqual({
                    index_templates: [
                        {
                            name: tempName,
                            index_template: {
                                index_patterns: indexPatterns,
                                template: {
                                    settings: { index: settings },
                                    mappings,
                                    aliases
                                },
                                composed_of: []
                            },
                        }
                    ]
                });
            }
        });
    });

    describe('indices.getMapping', () => {
        it('should get a mapping from an index', async () => {
            const resp = await client.indices.getMapping({ index });
            const expectedKeys = Object.keys(data[0]);

            const pathToProperties = `${index}.mappings.properties`;

            const keys = Object.keys(get(resp, pathToProperties, {}));

            expect(keys).toIncludeAllMembers(expectedKeys);
        });
    });

    describe('indices.getFieldMapping', () => {
        it('should get the mapping for a field', async () => {
            const field = 'uuid';
            const resp = await client.indices.getFieldMapping({
                index,
                fields: [field]
            });

            expect(resp).toBeDefined();
        });
    });

    describe('indices.putMapping', () => {
        it('should update a mapping to an index', async () => {
            const query: ClientParams.IndicesPutMappingParams = {
                index,
                body: {
                    properties: {
                        test: { type: 'keyword' }
                    }
                }
            };
            // NOTE: this mutates the fields
            const resp = await client.indices.putMapping(query);

            expect(resp.acknowledged).toBeTrue();
        });
    });

    describe('indices.getSettings', () => {
        it('should fetch settings', async () => {
            const resp = await client.indices.getSettings({ index });
            const settings = get(resp, `${index}.settings.index`) as any;

            expect(settings).toBeDefined();
            expect(settings.uuid).toBeString();
        });
    });

    describe('indices.putSettings', () => {
        it('can add settings', async () => {
            const resp = await client.indices.putSettings({
                index,
                body: {
                    settings: {
                        'index.max_result_window': 100000
                    }
                }
            });

            expect(resp.acknowledged).toBeTrue();
        });
    });

    describe('indices.refresh', () => {
        it('can refresh an index', async () => {
            const resp = await client.indices.refresh({ index });
            expect(resp._shards).toBeDefined();
        });
    });

    describe('indices.recovery', () => {
        it('can do something', async () => {
            const resp = await client.indices.recovery({ index });
            expect(resp[index].shards).toBeArray();
        });
    });

    describe('indices.validateQuery', () => {
        it('can verify a query', async () => {
            const goodQuery = {
                index,
                q: '_exists_:uuid'
            };
            const badQuery = {
                index,
                body: { foo: 'bar' }
            };

            const [goodResp, badResp] = await Promise.all([
                client.indices.validateQuery(goodQuery),
                client.indices.validateQuery(badQuery)
            ]);

            expect(badResp.valid).toBeFalse();
            expect(goodResp.valid).toBeTrue();
        });
    });

    describe('tasks.list', () => {
        it('should return tasks', async () => {
            const params: ClientParams.TasksListParams = {
                group_by: 'nodes',
                timeout: '60s'
            };

            const resp = await client.tasks.list(params);

            expect(resp.nodes).toBeDefined();
        });

        it('should return tasks with more parameters', async () => {
            const params: ClientParams.TasksListParams = {
                group_by: 'none',
                timeout: '60s',
                detailed: true
            };

            const resp = await client.tasks.list(params);

            expect(resp.tasks).toBeDefined();
        });
    });

    // we are combining as we need an action that is slow enough to persist
    // reliably to make tests pass, and we don't want multiple scenarios of these
    describe('tasks.get and tasks.cancel', () => {
        it('should get and cancel a task', async () => {
            const { task } = await client.reindex({
                requests_per_second: 1,
                wait_for_completion: false,
                body: {
                    source: {
                        index,
                        size: 10
                    },
                    dest: {
                        index: taskIndex
                    }
                }
            }) as ClientResponse.ReindexTaskResponse;

            const taskResp = await client.tasks.get({ task_id: task });

            expect(taskResp.completed).toBeFalse();
            expect(taskResp.task).toBeDefined();
            expect(taskResp.task.action).toInclude('reindex');

            const canceledTaskResp = await client.tasks.cancel({
                task_id: task
            });

            expect(canceledTaskResp.nodes).toBeDefined();
        });
    });
});
