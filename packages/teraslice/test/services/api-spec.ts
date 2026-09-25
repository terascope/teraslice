import got from 'got';
import express from 'express';
import http from 'node:http';
import { TestContext } from '@terascope/job-components';
import { findPort } from '../../src/lib/utils/port_utils.js';
import { ApiService } from '../../src/lib/cluster/services/api.js';
import { getPackageJSON } from '../../src/lib/utils/file_utils.js';

describe('HTTP API', () => {
    const { version } = getPackageJSON();

    const app = express();
    const assetsUrl = 'http://example.asset:1234';
    const context = new TestContext('http-api') as any;

    context.stores = {
        stateStorage: {},
        executionStorage: {},
        jobsStorage: {},
    } as any;

    context.services = {
        clusterService: {},
        executionService: {},
        jobsService: {},
    };

    context.sysconfig.terafoundation.connectors = {
        'elasticsearch-next': { os2: {}, os3: {} },
        kafka: { 'kafka-dev': {} },
        s3: { minio: {}, ceph: {} },
    };
    context.sysconfig.teraslice.state = { connection: 'os2' };
    context.sysconfig.teraslice.asset_storage_connection = 'ceph';
    context.sysconfig.teraslice.asset_storage_connection_type = 's3';

    let api: ApiService;
    let port: number;
    let baseUrl: string;
    let server: http.Server;

    beforeAll(async () => {
        port = await findPort();

        baseUrl = `http://localhost:${port}`;

        api = new ApiService(context, { assetsUrl, app });
        await api.initialize();

        await new Promise((resolve, reject) => {
            server = app.listen(port, (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });

        await api.initialize();
    });

    afterAll(async () => {
        if (api) {
            await api.shutdown();
        }
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
    });

    describe('GET /', () => {
        it('should the correct response', async () => {
            let response: Record<string, any>;

            try {
                response = await got(baseUrl, {
                    responseType: 'json',
                    throwHttpErrors: true
                });

                expect(response.body).toMatchObject({
                    arch: context.arch,
                    clustering_type: context.sysconfig.teraslice.cluster_manager_type,
                    name: context.sysconfig.teraslice.name,
                    node_version: process.version,
                    platform: context.platform,
                    teraslice_version: `v${version}`
                });
            } catch (err) {
                expect(err.stack).toBeNil();
            }
        });
    });

    describe('GET /cluster/connectors', () => {
        it('should return a flat array of connectors tagged with state cluster and asset store', async () => {
            let response: Record<string, any>;

            try {
                response = await got(`${baseUrl}/cluster/connectors`, {
                    responseType: 'json',
                    throwHttpErrors: true
                });

                expect(response.body).toEqual({
                    connectors: [
                        { type: 'elasticsearch-next', name: 'os2', is_state_cluster: true },
                        { type: 'elasticsearch-next', name: 'os3', is_state_cluster: false },
                        { type: 'kafka', name: 'kafka-dev' },
                        { type: 's3', name: 'minio', is_asset_store: false },
                        { type: 's3', name: 'ceph', is_asset_store: true },
                    ]
                });
            } catch (err) {
                expect(err.stack).toBeNil();
            }
        });

        it('should filter by type', async () => {
            let response: Record<string, any>;

            try {
                response = await got(`${baseUrl}/cluster/connectors`, {
                    searchParams: { type: 'kafka' },
                    responseType: 'json',
                    throwHttpErrors: true
                });

                expect(response.body).toEqual({
                    connectors: [
                        { type: 'kafka', name: 'kafka-dev' },
                    ]
                });
            } catch (err) {
                expect(err.stack).toBeNil();
            }
        });

        it('should filter by name', async () => {
            let response: Record<string, any>;

            try {
                response = await got(`${baseUrl}/cluster/connectors`, {
                    searchParams: { name: 'os2' },
                    responseType: 'json',
                    throwHttpErrors: true
                });

                expect(response.body).toEqual({
                    connectors: [
                        { type: 'elasticsearch-next', name: 'os2', is_state_cluster: true },
                    ]
                });
            } catch (err) {
                expect(err.stack).toBeNil();
            }
        });

        it('should return the grouped-by-type view when groupBy=type', async () => {
            let response: Record<string, any>;

            try {
                response = await got(`${baseUrl}/cluster/connectors`, {
                    searchParams: { groupBy: 'type' },
                    responseType: 'json',
                    throwHttpErrors: true
                });

                expect(response.body).toEqual({
                    connectors: {
                        'elasticsearch-next': ['os2', 'os3'],
                        kafka: ['kafka-dev'],
                        s3: ['minio', 'ceph'],
                    }
                });
            } catch (err) {
                expect(err.stack).toBeNil();
            }
        });
    });
});
