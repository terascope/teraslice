import { TerafoundationConfig, TestContext, TestContextOptions } from '@terascope/job-components';
import { createClient } from 'elasticsearch-store';
import { AssetsService } from '../../src/lib/cluster/services/assets';

describe('Assets Service', () => {
    const contextOptions: TestContextOptions = {
        assignment: 'assets_service',
        clients: [
            {
                type: 'elasticsearch-next',
                createClient,
                endpoint: 'default'
            }
        ]

    };
    /// It's important to keep the test context name unique
    /// This is so we don't share indices and buckets with other test suites
    const context = new TestContext('assets-spec-test', contextOptions);
    const mockTerafoundation: TerafoundationConfig = {
        asset_storage_connection_type: 's3',
        asset_storage_connection: 'default',
        asset_storage_bucket: 'assets-spec-test-bucket',
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
                    node: [process.env.ELASTICSEARCH_HOST]
                },
            },
        }
    };
    context.sysconfig.terafoundation = mockTerafoundation;
    context.sysconfig.teraslice.api_response_timeout = 30000;
    /// Setting port for the asset service
    process.env.port = '55678';
    const service = new AssetsService(context);

    beforeAll(async () => {
        await service.initialize();
    });

    beforeAll(async () => {
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

    // describe('createAssetTable function', () => {
    //     it('Should return proper table', async () => {
    //         const s3List: Record<string, any>[] = [
    //             { File: '123.zip', Size: '12345'},
    //             { File: 'abc.zip', Size: '56873'},
    //             { File: 'foo.zip', Size: '1'},
    //         ];
    //         const esList: Record<string, any>[] = [
    //             {
    //                 _created: '500BC',
    //                 id: '50000',
    //                 name: 'asset-123',
    //                 version: '1.0.0',
    //                 description: 'A description',
    //                 node_version: 19,
    //                 platform: '',
    //                 arch: 'arm64'
    //             }
    //         ];

    //         // Do this because getAssetStatus is a private function
    //         const result = service['getAssetStatus'](s3List, esList);
    //         expect(result[0].external_storage).toEqual('missing');
    //     });
    // });
});