import { debugLogger, DataEntity } from '@terascope/utils';
import { createClient, WrappedClient, Semver, } from '../../src';
import {
    ConflictOptions,
    OpTypes,
    ScriptLangs
} from '../../src/elasticsearch-client/method-helpers/interfaces';
import {
    upload,
    cleanupIndex,
    waitForData,
    getDistributionAndVersion
} from '../helpers/elasticsearch';
import { data } from '../helpers/data';

const testLogger = debugLogger('create-client-test');

const {
    version,
    host,
    distribution
} = getDistributionAndVersion();

const semver = version.split('.').map((i) => parseInt(i, 10)) as Semver;

const testIndices = [
    'test-reindex2',
    'test-reindex3',
    'test-reindex4',
    'test-reindex5',
    'test-reindex6'
];

describe('search', () => {
    let wrappedClient: WrappedClient;
    const index = 'test-reindex';
    const docType = '_doc';
    let client: any;

    beforeAll(async () => {
        ({ client } = await createClient({ node: host }, testLogger));

        wrappedClient = new WrappedClient(client, distribution, semver);

        const testData = data.slice(0, 10).map((doc, i) => DataEntity.make(doc, { _key: i + 1 }));

        await cleanupIndex(client, index);

        await upload(client, { index, type: docType }, testData);
        await waitForData(client, index, 10);
    });

    afterAll(async () => {
        await cleanupIndex(client, index);
        await Promise.all(testIndices.map((i) => cleanupIndex(client, i)));
    });

    it('should reindex test index', async () => {
        const params = {
            body: {
                source: {
                    index
                },
                dest: {
                    index: 'test-reindex2'
                }
            }
        };

        const resp = await wrappedClient.reindex(params);

        expect(resp.total).toBe(10);
        expect(resp.created).toBe(10);
        expect(resp.failures.length).toBe(0);
    });

    it('should handle types in reindex params', async () => {
        const params = {
            body: {
                source: {
                    index
                },
                dest: {
                    index: 'test-reindex3',
                    type: '_doc'
                }
            }
        };

        const resp = await wrappedClient.reindex(params);

        expect(resp.total).toBe(10);
        expect(resp.created).toBe(10);
        expect(resp.failures.length).toBe(0);
    });

    it('should handle a script in reindex params', async () => {
        const params = {
            body: {
                source: {
                    index
                },
                dest: {
                    index: 'test-reindex4',
                    type: '_doc'
                },
                script: {
                    source: 'ctx._source.host = ctx._source.remove("url")',
                    lang: ScriptLangs.painless
                }
            }
        };

        const resp = await wrappedClient.reindex(params as any);

        expect(resp.total).toBe(10);
        expect(resp.created).toBe(10);
        expect(resp.failures.length).toBe(0);
    });

    it('should handle a query in source params', async () => {
        const params = {
            body: {
                source: {
                    index,
                    query: { match: { uuid: 'bd920141-45b3-41fd-8eea-b1640a2fa3d2' } }
                },
                dest: {
                    index: 'test-reindex6',
                    type: '_doc'
                }
            }
        };

        const resp = await wrappedClient.reindex(params);

        expect(resp.total).toBe(1);
        expect(resp.created).toBe(1);
        expect(resp.failures.length).toBe(0);
    });

    it('should handle additional reindex params', async () => {
        const params = {
            refresh: true,
            max_docs: 5,
            wait_for_active_shards: 1,
            requests_per_second: 100,
            body: {
                conflicts: ConflictOptions.proceed,
                source: {
                    index,
                    _source: ['url', 'ip', 'created', 'userAgent']
                },
                dest: {
                    index: 'test-reindex5',
                    type: '_doc',
                    op_type: OpTypes.create
                }
            }
        };

        const resp = await wrappedClient.reindex(params);

        if (distribution === 'elasticsearch') {
            if (semver[0] === 6) {
                expect(resp.total).toBe(10);
                expect(resp.created).toBe(10);
            } else {
                expect(resp.total).toBe(5);
                expect(resp.created).toBe(5);
            }
        }
    });
});
