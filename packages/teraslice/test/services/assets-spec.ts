import { TestContext, TestContextOptions } from '@terascope/job-components';
import fs from 'node:fs';
import got from 'got';
import { Logger } from '@terascope/utils';
import { createClient } from '@terascope/opensearch-client';
import { createS3Client } from '@terascope/file-asset-apis';
import { AssetsService } from '../../src/lib/cluster/services/assets';
import { TEST_INDEX_PREFIX } from '../test.config';
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
                default: {
                    endpoint: process.env.MINIO_HOST,
                    accessKeyId: process.env.MINIO_ACCESS_KEY,
                    secretAccessKey: process.env.MINIO_SECRET_KEY,
                    forcePathStyle: true,
                    sslEnabled: false,
                    region: 'test-region'
                },
            },
            'elasticsearch-next': {
                default: {
                    node: [process.env.SEARCH_TEST_HOST]
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
        await service.shutdown();
    });

    describe('getS3AssetStatus function', () => {
        it('Should return correct info if given valid lists', async () => {
            const s3List: Record<string, any>[] = [
                { File: '123.zip', Size: '12345' },
                { File: 'abc.zip', Size: '56873' },
                { File: 'foo.zip', Size: '1' },
            ];
            const esList: Record<string, any>[] = [
                {
                    _created: '500BC',
                    id: '123',
                    name: 'asset-123',
                    version: '1.0.0',
                    description: 'A description',
                    node_version: 19,
                    platform: '',
                    arch: 'arm64'
                },
                {
                    _created: '2020-12-20T17:16:44.036Z',
                    id: 'abc',
                    name: 'asset-abc',
                    version: '1.0.0',
                    description: 'A description',
                    node_version: 19,
                    platform: '',
                    arch: ''
                },
                {
                    _created: '2024-03-20T17:16:05.037Z',
                    id: 'foo',
                    name: 'foo-asset',
                    version: '6.7.1',
                    description: 'test',
                    node_version: 18,
                    platform: '',
                    arch: ''
                }
            ];

            // Do this because getS3AssetStatus is a private function
            // @ts-expect-error
            const result = service.getS3AssetStatus(s3List, esList);
            expect(result[0].external_storage).toEqual('available');
            expect(result[1].external_storage).toEqual('available');
            expect(result[2].external_storage).toEqual('available');
        });

        it('Should return "missing" if id is not available in s3List', async () => {
            const s3List: Record<string, any>[] = [
                { File: '123.zip', Size: '12345' },
                { File: 'abc.zip', Size: '56873' },
                { File: 'foo.zip', Size: '1' },
            ];
            const esList: Record<string, any>[] = [
                {
                    _created: '500BC',
                    id: '50000',
                    name: 'asset-123',
                    version: '1.0.0',
                    description: 'A description',
                    node_version: 19,
                    platform: '',
                    arch: 'arm64'
                }
            ];

            // Do this because getS3AssetStatus is a private function
            // @ts-expect-error
            const result = service.getS3AssetStatus(s3List, esList);
            expect(result[0].external_storage).toEqual('missing');
        });
    });

    describe('Testing /txt/assets enpoint', () => {
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
