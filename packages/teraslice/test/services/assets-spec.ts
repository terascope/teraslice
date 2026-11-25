import { TestContext, TestContextOptions } from '@terascope/job-components';
import fs from 'node:fs';
import got from 'got';
import { Logger } from '@terascope/core-utils';
import { createClient } from '@terascope/opensearch-client';
import { createS3Client } from '@terascope/file-asset-apis';
import { AssetsService } from '../../src/lib/cluster/services/assets.js';
import { S3_CONNECTOR_CONFIG, SEARCH_TEST_HOST, TEST_INDEX_PREFIX } from '../test.config.js';
import { findPort } from '../../src/lib/utils/port_utils.js';

describe('Assets Service', () => {
    const contextOptions: TestContextOptions = {
        assignment: 'assets_service',
        clients: [
            {
                type: 'elasticsearch-next',
                async createClient(customConfig: Record<string, any>, logger: Logger) {
                    const { client } = await createClient(customConfig, logger);
                    return { client, logger };
                },
                endpoint: 'default'
            },
            {
                type: 's3',
                createClient: async (customConfig: Record<string, any>, logger: Logger) => {
                    const client = await createS3Client(customConfig, logger);
                    return { client, logger };
                },
                endpoint: 'default'
            }
        ]

    };
    /// It's important to keep the test context name unique
    /// This is so we don't share indices and buckets with other test suites
    const context = new TestContext(`${TEST_INDEX_PREFIX}assets-spec-test`, contextOptions);
    context.sysconfig.terafoundation = Object.assign(context.sysconfig.terafoundation, {
        prom_metrics_enabled: false,
        prom_metrics_port: 3333,
        prom_metrics_add_default: true,
        connectors: {
            s3: {
                default: S3_CONNECTOR_CONFIG,
            },
            'elasticsearch-next': {
                default: {
                    node: [SEARCH_TEST_HOST]
                },
            },
        }
    });
    context.sysconfig.teraslice.asset_storage_connection_type = 's3';
    context.sysconfig.teraslice.asset_storage_connection = 'default';
    context.sysconfig.teraslice.asset_storage_bucket = 'assets-spec-test-bucket';
    context.sysconfig.teraslice.api_response_timeout = 30000;

    let service: AssetsService;

    beforeAll(async () => {
        /// Setting port for the asset service
        process.env.port = (await findPort()).toString();
        service = new AssetsService(context);
        await service.initialize();
    });

    afterAll(async () => {
        // Clean up asset process
        await service.shutdown(Date.now() + context.sysconfig.teraslice.shutdown_timeout);
    });

    describe('Testing /txt/assets endpoint', () => {
        it('Should return proper table with specific format', async () => {
            const filePathOne = 'packages/teraslice/test/fixtures/assets/asset-with-long-description.zip';
            const filePathOneStream = fs.readFileSync(filePathOne);
            // Upload file to storage
            await service.assetsStorage.save(filePathOneStream);

            const resultTable = await got.get(`http://localhost:${process.env.port}/txt/assets`, {
                searchParams: {
                    fields: 'name,version,id,description,node_version,platform,arch'
                }
            }).text();

            expect(resultTable).toEqual(
                'name                         version  id                                        description                     node_version  platform  arch\n'
                + '---------------------------  -------  ----------------------------------------  ------------------------------  ------------  --------  ----\n'
                + 'asset-with-long-description  3.6.3    ba53aa515e20e0c7da93bd2a373b84819fba7b2a  This description is longer tha  18                          \n'
            );
        });
    });
});
