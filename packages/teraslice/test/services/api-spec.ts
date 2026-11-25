import 'jest-extended';
import { jest } from '@jest/globals';
import got from 'got';
import express from 'express';
import http from 'node:http';
import { TestContext } from '@terascope/job-components';
import { TSError } from '@terascope/core-utils';
import { findPort } from '../../src/lib/utils/port_utils.js';
import { ApiService } from '../../src/lib/cluster/services/api/api.js';
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

    describe('GET /jobs/:jobId/tap and /ex/:exId/tap', () => {
        const exId = 'some-ex-id';
        const tapResults = {
            workerId: 'some-worker',
            sliceId: 'some-slice',
            records: [[{ record: { id: 1 }, metadata: { _key: '1' } }]]
        };

        const getSliceTap = jest.fn<(...args: any[]) => Promise<any>>();
        const getLatestExecutionId = jest.fn<(...args: any[]) => Promise<any>>();

        function getTap(path: string, searchParams: Record<string, string> = {}) {
            return got(`${baseUrl}/v1/${path}/tap`, {
                searchParams,
                responseType: 'json',
                throwHttpErrors: false
            });
        }

        beforeAll(() => {
            context.services.executionService.getSliceTap = getSliceTap;
            context.services.jobsService.getLatestExecutionId = getLatestExecutionId;
        });

        beforeEach(() => {
            getSliceTap.mockReset().mockResolvedValue(Buffer.from(JSON.stringify(tapResults)));
            getLatestExecutionId.mockReset().mockResolvedValue(exId);
        });

        it('should tap the latest execution of a job with the default size', async () => {
            const response = await getTap('jobs/some-job-id');

            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toStartWith('application/json');
            expect(response.body).toEqual(tapResults);
            expect(getLatestExecutionId).toHaveBeenCalledWith('some-job-id');
            expect(getSliceTap).toHaveBeenCalledWith(exId, { size: 10 });
        });

        it('should tap an execution by id without looking up the job', async () => {
            const response = await getTap('ex/other-ex-id');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual(tapResults);
            expect(getLatestExecutionId).not.toHaveBeenCalled();
            expect(getSliceTap).toHaveBeenCalledWith('other-ex-id', { size: 10 });
        });

        it('should pass the validated size to the execution service', async () => {
            const response = await getTap('ex/some-ex-id', { size: 'all' });

            expect(response.statusCode).toEqual(200);
            expect(getSliceTap).toHaveBeenCalledWith(exId, { size: 0 });
        });

        it('should respond with a 400 for an invalid size', async () => {
            const response = await getTap('jobs/some-job-id', { size: '2.5' });

            expect(response.statusCode).toEqual(400);
            expect(response.body).toMatchObject({
                message: expect.stringContaining('Argument "size" must be "all", 0, or a positive integer')
            });
            expect(getSliceTap).not.toHaveBeenCalled();
        });

        it('should respond with a 404 when the job has no executions', async () => {
            getLatestExecutionId.mockResolvedValue(undefined);

            const response = await getTap('jobs/some-job-id');

            expect(response.statusCode).toEqual(404);
            expect(getSliceTap).not.toHaveBeenCalled();
        });

        it('should respond with a 500 when the tap fails', async () => {
            getSliceTap.mockRejectedValue(new Error('No client found by that id "some-ex-id"'));

            const response = await getTap('ex/some-ex-id');

            expect(response.statusCode).toEqual(500);
            expect(response.body).toMatchObject({
                message: expect.stringContaining('No client found by that id')
            });
        });
    });

    // v2 names the missing job or execution; v1 keeps the backend's message
    describe('v1 not-found responses', () => {
        const jobsGet = jest.fn<(...args: any[]) => Promise<any>>();
        const getExecutionContext = jest.fn<(...args: any[]) => Promise<any>>();
        const stateSearch = jest.fn<(...args: any[]) => Promise<any>>();

        function get(path: string) {
            return got(`${baseUrl}/v1/${path}`, {
                responseType: 'json',
                throwHttpErrors: false
            });
        }

        beforeAll(() => {
            context.stores.jobsStorage.get = jobsGet;
            context.stores.stateStorage.search = stateSearch;
            context.services.executionService.getExecutionContext = getExecutionContext;
        });

        beforeEach(() => {
            jobsGet.mockReset().mockRejectedValue(
                new TSError('Response Error', { statusCode: 404 })
            );
            getExecutionContext.mockReset().mockRejectedValue(
                new TSError('Response Error', { statusCode: 404 })
            );
            stateSearch.mockReset().mockResolvedValue([]);
        });

        it('should keep the backend message for a missing job', async () => {
            const response = await get('jobs/nope');

            expect(response.statusCode).toEqual(404);
            expect(response.body).toMatchObject({ message: 'Response Error' });
        });

        it('should keep the backend message for a missing execution', async () => {
            const response = await get('ex/nope');

            expect(response.statusCode).toEqual(404);
            expect(response.body).toMatchObject({ message: 'Response Error' });
        });

        it('should return an empty list of errors for an unknown execution', async () => {
            const response = await get('ex/nope/errors');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual([]);
            expect(getExecutionContext).not.toHaveBeenCalled();
        });
    });

    describe('GET /txt routes', () => {
        const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

        /** The table rows, without headers, trimmed */
        async function getRows(path: string, searchParams: Record<string, string>) {
            const response = await got(`${baseUrl}${path}`, {
                searchParams: { ...searchParams, headers: 'false' },
                throwHttpErrors: true
            });
            return response.body.split('\n').map((line) => line.trim())
                .filter(Boolean);
        }

        beforeAll(() => {
            context.services.executionService.findAllWorkers = async () => ids.map(
                (id) => ({ ex_id: id })
            );
            context.services.clusterService.getClusterState = async () => Object.fromEntries(
                ids.map((id) => [id, { node_id: id, active: [] }])
            );
            context.services.executionService.getControllerStats = async () => ids.map(
                (id) => ({ ex_id: id })
            );
        });

        describe.each([
            ['/txt/workers', 'ex_id'],
            ['/txt/nodes', 'node_id'],
            ['/txt/slicers', 'ex_id'],
            ['/txt/controllers', 'ex_id'],
        ])('GET %s', (path, field) => {
            it('should return the first page', async () => {
                const rows = await getRows(path, { fields: field, size: '3' });
                expect(rows).toEqual(['a', 'b', 'c']);
            });

            it('should return a page starting at from', async () => {
                const rows = await getRows(path, { fields: field, from: '2', size: '3' });
                expect(rows).toEqual(['c', 'd', 'e']);
            });

            it('should return size records when from is more than size', async () => {
                const rows = await getRows(path, { fields: field, from: '4', size: '2' });
                expect(rows).toEqual(['e', 'f']);
            });

            it('should return a partial last page', async () => {
                const rows = await getRows(path, { fields: field, from: '5', size: '3' });
                expect(rows).toEqual(['f', 'g']);
            });
        });
    });
});
