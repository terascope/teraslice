import { debugLogger, pMap, toNumber } from '@terascope/utils';
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

    beforeAll(async () => {
        const { client } = await createClient(config, testLogger);

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
            expect.hasAssertions();
            // singular include, has type
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

            await pMap([bodyTypeQuery], async (query) => {
                const response = await wrappedClient.count(query);
                expect(response).toMatchObject({ count: 1 });
            });
        });
    });
});
