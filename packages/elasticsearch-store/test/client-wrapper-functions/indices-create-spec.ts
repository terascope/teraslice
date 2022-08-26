import { debugLogger } from '@terascope/utils';
import { createClient, WrappedClient, Semver, } from '../../src';
import {
    cleanupIndex,
    getDistributionAndVersion
} from '../helpers/elasticsearch';

const testLogger = debugLogger('create-client-test');

const {
    version,
    host,
    distribution
} = getDistributionAndVersion();

const semver = version.split('.').map((i) => parseInt(i, 10)) as Semver;

describe('indices.get', () => {
    let wrappedClient: WrappedClient;
    const index = 'test-indices-create';
    const otherIndex = 'test-indices-create-with-settings-type';
    const anotherIndex = 'test-indices-create-with-settings';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);
    });

    afterAll(async () => {
        await Promise.all([
            cleanupIndex(client, index),
            cleanupIndex(client, otherIndex),
            cleanupIndex(client, anotherIndex),
        ]);
    });

    it('should create new index', async () => {
        const params = {
            index
        };

        const resp = await wrappedClient.indices.create(params);

        expect(resp.acknowledged).toBeTrue();
        expect(resp.shards_acknowledged).toBeTrue();
        expect(resp.index).toBe(index);
    });

    it('should create new index with mappings, alias, and settings if types present', async () => {
        const params = {
            index: otherIndex,
            include_type_name: true,
            body: {
                aliases: {
                    'test-indices-yo-mama': {
                        is_write_index: true,
                        is_hidden: false
                    }
                },
                mappings: {
                    _doc: {
                        properties: {
                            _key: { type: 'keyword' },
                            name: { type: 'text' },
                            age: { type: 'short' }
                        }
                    }
                },
                settings: {
                    number_of_shards: 3,
                    number_of_replicas: 2,
                    max_result_window: 10
                }
            }
        };

        const resp = await wrappedClient.indices.create(params);

        expect(resp.acknowledged).toBeTrue();
        expect(resp.shards_acknowledged).toBeTrue();
        expect(resp.index).toBe(otherIndex);
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

        const resp = await wrappedClient.indices.create(params);

        expect(resp.acknowledged).toBeTrue();
        expect(resp.shards_acknowledged).toBeTrue();
        expect(resp.index).toBe(anotherIndex);
    });
});
