import got from 'got';
import express from 'express';
import http from 'node:http';
import { TestContext } from '@terascope/job-components';
import { findPort } from '../../src/lib/utils/port_utils';
import { ApiService } from '../../src/lib/cluster/services/api';
import { getPackageJSON } from '../../src/lib/utils/file_utils';

describe('HTTP API', () => {
    const { version } = getPackageJSON();

    const app = express();
    const assetsUrl = 'http://example.asset:1234';
    const context = new TestContext('http-api') as any;

    context.stores = {
        state: {},
        execution: {},
        jobs: {},
    } as any;

    context.services = {
        cluster: {},
        execution: {},
        jobs: {},
    };

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
            // @ts-expect-error
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
});
