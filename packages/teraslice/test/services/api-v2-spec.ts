import 'jest-extended';
import got from 'got';
import express from 'express';
import http from 'node:http';
import { z } from 'zod';
import { TestContext } from '@terascope/job-components';
import { findPort } from '../../src/lib/utils/port_utils.js';
import { ApiService } from '../../src/lib/cluster/services/api.js';
import { createV2Registry } from '../../src/lib/cluster/services/api-v2.js';

describe('HTTP API /v2', () => {
    const app = express();
    const assetsUrl = 'http://example.asset:1234';
    const context = new TestContext('http-api-v2') as any;

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
    let baseUrl: string;
    let server: http.Server;

    beforeAll(async () => {
        const port = await findPort();
        baseUrl = `http://localhost:${port}/v2`;

        api = new ApiService(context, { assetsUrl, app });
        await api.initialize();

        await new Promise((resolve, reject) => {
            server = app.listen(port, (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    });

    afterAll(async () => {
        if (api) {
            await api.shutdown();
        }
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
    });

    async function get(path: string, searchParams?: Record<string, string>) {
        const response = await got(`${baseUrl}${path}`, {
            searchParams,
            responseType: 'json',
            throwHttpErrors: false,
        });
        return { status: response.statusCode, body: response.body as any };
    }

    describe('GET /v2/cluster/connectors', () => {
        it('should return a flat array of connectors tagged with state cluster and asset store', async () => {
            const { status, body } = await get('/cluster/connectors');

            expect(status).toBe(200);
            expect(body).toEqual({
                connectors: [
                    { type: 'elasticsearch-next', name: 'os2', is_state_cluster: true },
                    { type: 'elasticsearch-next', name: 'os3', is_state_cluster: false },
                    { type: 'kafka', name: 'kafka-dev' },
                    { type: 's3', name: 'minio', is_asset_store: false },
                    { type: 's3', name: 'ceph', is_asset_store: true },
                ]
            });
        });

        it('should filter by type', async () => {
            const { status, body } = await get('/cluster/connectors', { type: 'kafka' });

            expect(status).toBe(200);
            expect(body).toEqual({
                connectors: [{ type: 'kafka', name: 'kafka-dev' }]
            });
        });

        it('should filter by name', async () => {
            const { status, body } = await get('/cluster/connectors', { name: 'os2' });

            expect(status).toBe(200);
            expect(body).toEqual({
                connectors: [{ type: 'elasticsearch-next', name: 'os2', is_state_cluster: true }]
            });
        });

        it('should return the grouped-by-type view when groupBy=type', async () => {
            const { status, body } = await get('/cluster/connectors', { groupBy: 'type' });

            expect(status).toBe(200);
            expect(body).toEqual({
                connectors: {
                    'elasticsearch-next': ['os2', 'os3'],
                    kafka: ['kafka-dev'],
                    s3: ['minio', 'ceph'],
                }
            });
        });

        it('should respond with a 400 for an unsupported groupBy', async () => {
            const { status, body } = await get('/cluster/connectors', { groupBy: 'name' });

            expect(status).toBe(400);
            expect(body.error).toBe(400);
            expect(body.message).toContain('Invalid request query');
            expect(body.message).toContain('groupBy');
        });

        it('should respond with a 400 for an unknown query param', async () => {
            const { status, body } = await get('/cluster/connectors', { group_by: 'type' });

            expect(status).toBe(400);
            expect(body.message).toContain('Invalid request query');
            expect(body.message).toContain('Unrecognized key: "group_by"');
        });
    });

    // The OpenAPI spec is built with z.toJSONSchema, which throws on valid zod
    // it can't represent (.transform(), z.date(), z.custom(), z.instanceof(), ...).
    // Checking every registered route here names the offending route and part.
    describe('route schemas', () => {
        it('should all convert to JSON Schema', () => {
            const { routes } = createV2Registry(api);
            expect(routes).not.toBeEmpty();

            const failures: string[] = [];
            for (const route of routes) {
                const parts = [
                    ['params', route.params, 'input'],
                    ['query', route.query, 'input'],
                    ['body', route.body, 'input'],
                    ['response', route.response, 'output'],
                ] as const;

                for (const [part, schema, io] of parts) {
                    if (!schema) continue;
                    try {
                        z.toJSONSchema(schema, { io });
                    } catch (err) {
                        failures.push(`${route.method.toUpperCase()} ${route.path} ${part}: ${err.message}`);
                    }
                }
            }

            expect(failures).toEqual([]);
        });
    });
});
