import { debugLogger, toNumber } from '@terascope/utils';
import { ElasticsearchDistribution } from '@terascope/types';
import { createClient, WrappedClient, Semver, } from '../src';
import * as helpers from '../src/elasticsearch-client/method-helpers/index';
import { upload, cleanupIndex, waitForData } from './helpers/elasticsearch';
import {
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_VERSION,
    OPENSEARCH_HOST,
    OPENSEARCH_VERSION
} from './helpers/config';
import { data } from './helpers/data';

describe('can create an elasticsearch or opensearch client', () => {
    const index = 'wrapped_client_test';
    const docType = '_doc';

    const testLogger = debugLogger('create-client-test');
    const config = { node: '' };
    let expectedDistribution: ElasticsearchDistribution;
    let expectedVersion: string;

    if (process.env.TEST_OPENSEARCH != null) {
        config.node = OPENSEARCH_HOST;
        expectedDistribution = ElasticsearchDistribution.opensearch;
        expectedVersion = OPENSEARCH_VERSION;
    } else {
        config.node = ELASTICSEARCH_HOST;
        expectedDistribution = ElasticsearchDistribution.elasticsearch;
        expectedVersion = ELASTICSEARCH_VERSION;
    }

    let wrappedClient: WrappedClient;
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient(config, testLogger));

        await cleanupIndex(client, index);

        const semver = expectedVersion.split('.').map(toNumber) as unknown as Semver;
        if (semver.length !== 3) {
            throw new Error(`Expected version to follow semver format (major.minor.patch) got ${expectedVersion}`);
        }

        await upload(client, { index, type: docType }, data);
        await waitForData(client, index, 1000);

        wrappedClient = new WrappedClient(client, expectedDistribution, semver);
    });

    describe('count', () => {
        it('can return how many match a query', async () => {
            const response = await wrappedClient.count({ index });

            expect(response).toBeObject();
            expect(response).toHaveProperty('count');
            expect(response).toMatchObject({ count: 1000 });
        });

        it('can convert params of other version to be compatible', async () => {
            // has type, should be removed in Elasticsearch v8 tests
            const bodyTypeQuery: helpers.CountParams = {
                index,
                type: docType,
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

            const response = await wrappedClient.count(bodyTypeQuery);
            expect(response).toMatchObject({ count: 1 });
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
            const bodyTypeQuery: helpers.CreateParams = {
                index: createIndex,
                type: docType,
                refresh: true,
                id: recordID,
                body: record
            };

            const response = await wrappedClient.create(bodyTypeQuery);

            expect(response).toHaveProperty('_index', createIndex);
            expect(response).toHaveProperty('_id', recordID);
            expect(response).toHaveProperty('_version');
            expect(response).toHaveProperty('result', 'created');
            expect(response).toHaveProperty('_shards');
            expect(response).toHaveProperty('_seq_no');
            expect(response).toHaveProperty('_primary_term');
        });
    });

    describe('delete', () => {
        const deleteIndex = `${index}_delete`;

        beforeAll(async () => {
            await cleanupIndex(client, deleteIndex);
            await upload(client, { index: deleteIndex, type: docType }, data);
            await waitForData(client, deleteIndex, 1000);
        });

        afterAll(async () => {
            await cleanupIndex(client, deleteIndex);
        });

        it('can delete a single records', async () => {
            const bodyTypeQuery: helpers.DeleteParams = {
                index: deleteIndex,
                type: docType,
                id: '3849b210-d8b8-4708-b70d-90b043a2598d'
            };

            const response = await wrappedClient.delete(bodyTypeQuery);

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
            await upload(client, { index: deleteByQueryIndex, type: docType }, data);
            await waitForData(client, deleteByQueryIndex, 1000);
        });

        afterAll(async () => {
            await cleanupIndex(client, deleteByQueryIndex);
        });

        it('can delete multiple records by query', async () => {
            const bodyTypeQuery: helpers.DeleteByQueryParams = {
                index: deleteByQueryIndex,
                type: docType,
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

            const response = await wrappedClient.deleteByQuery(bodyTypeQuery);

            expect(response).toHaveProperty('took');
            expect(response).toHaveProperty('total', 406);
            expect(response).toHaveProperty('deleted', 406);
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
            const bodyTypeQuery: helpers.GetParams = {
                index,
                type: docType,
                id: record.uuid,
            };

            const response = await wrappedClient.get(bodyTypeQuery);

            expect(response).toHaveProperty('_index', index);
            expect(response).toHaveProperty('_id', record.uuid);
            expect(response).toHaveProperty('found', true);
            expect(response._source).toMatchObject(record);
        });

        it('records returned can have removed fields', async () => {
            const bodyTypeQuery: helpers.GetParams = {
                index,
                type: docType,
                id: record.uuid,
                _source_excludes: ['location', 'ipv6', 'userAgent']
            };

            const {
                location, ipv6, userAgent, ...parsedRecord
            } = record;

            const response = await wrappedClient.get(bodyTypeQuery);

            expect(response).toHaveProperty('_index', index);
            expect(response).toHaveProperty('_id', record.uuid);
            expect(response).toHaveProperty('found', true);
            expect(response._source).toMatchObject(parsedRecord);
        });
    });

    describe('cluster.get_settings', () => {
        it('can fetch settings from the cluster', async () => {
            const response = await wrappedClient.cluster.get_settings();

            expect(response).toHaveProperty('persistent');
            expect(response).toHaveProperty('transient');
        });
    });

    describe('cluster.health', () => {
        it('can fetch the health of the cluster', async () => {
            const response = await wrappedClient.cluster.health();

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
            const response = await wrappedClient.cat.indices();

            expect(typeof response).toEqual('string');
            expect(response).toInclude(index);
            // the size of the index
            expect(response).toInclude('1000');
        });
    });

    describe('nodes.info', () => {
        it('can fetch info from the nodes', async () => {
            const response = await wrappedClient.nodes.info();

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
            const response = await wrappedClient.nodes.stats();

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
            expect(node).toHaveProperty('indices.docs.count', 1000);
            expect(node).toHaveProperty('os');
            expect(node).toHaveProperty('process');
            expect(node).toHaveProperty('jvm');
        });
    });
});
