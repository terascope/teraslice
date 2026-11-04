import 'jest-extended';
import { jest } from '@jest/globals';
import got from 'got';
import express from 'express';
import http from 'node:http';
import { z } from 'zod';
import { TestContext } from '@terascope/job-components';
import { findPort } from '../../src/lib/utils/port_utils.js';
import { ApiService } from '../../src/lib/cluster/services/api.js';
import { createV2Registry } from '../../src/lib/cluster/services/api-v2.js';
import { getPackageJSON } from '../../src/lib/utils/file_utils.js';

describe('HTTP API v2', () => {
    const { version } = getPackageJSON();

    const app = express();
    const assetsUrl = 'http://example.asset:1234';
    const context = new TestContext('http-api-v2') as any;

    const notDeleted = '(_deleted:false OR (* AND -_deleted:*))';

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

    function request(method: string, path: string, options: Record<string, any> = {}) {
        return got(`${baseUrl}${path}`, {
            method: method as any,
            responseType: 'json',
            throwHttpErrors: false,
            ...options
        }) as Promise<any>;
    }

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

    describe('GET /v2', () => {
        it('should return the cluster info', async () => {
            const response = await request('GET', '/v2');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                arch: context.arch,
                clustering_type: context.sysconfig.teraslice.cluster_manager_type,
                name: context.sysconfig.teraslice.name,
                node_version: process.version,
                platform: context.platform,
                teraslice_version: `v${version}`
            });
        });
    });

    describe('GET /v2/cluster/*', () => {
        const getClusterState = jest.fn<(...args: any[]) => any>();
        const getClusterAnalytics = jest.fn<(...args: any[]) => any>();
        const getControllerStats = jest.fn<(...args: any[]) => Promise<any>>();

        beforeAll(() => {
            context.services.clusterService.getClusterState = getClusterState;
            context.services.executionService.getClusterAnalytics = getClusterAnalytics;
            context.services.executionService.getControllerStats = getControllerStats;
        });

        beforeEach(() => {
            getClusterState.mockReset().mockReturnValue({ node1: { active: [] } });
            getClusterAnalytics.mockReset().mockReturnValue({ controllers: { processed: 1 } });
            getControllerStats.mockReset().mockResolvedValue([{ ex_id: 'ex-1' }]);
        });

        it('should return the cluster state', async () => {
            const response = await request('GET', '/v2/cluster/state');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ node1: { active: [] } });
        });

        it('should return the connectors', async () => {
            const response = await request('GET', '/v2/cluster/connectors', {
                searchParams: { type: 'kafka' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                connectors: [{ type: 'kafka', name: 'kafka-dev' }]
            });
        });

        it('should return the stats without the slicer alias', async () => {
            const response = await request('GET', '/v2/cluster/stats');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ controllers: { processed: 1 } });
        });

        it('should return all controller stats', async () => {
            const response = await request('GET', '/v2/cluster/controllers');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual([{ ex_id: 'ex-1' }]);
            expect(getControllerStats).toHaveBeenCalledWith();
        });
    });

    describe('GET /v2/cluster/connectors', () => {
        it('should return a flat array of connectors tagged with state cluster and asset store', async () => {
            const response = await request('GET', '/v2/cluster/connectors');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                connectors: [
                    { type: 'elasticsearch-next', name: 'os2', is_state_cluster: true },
                    { type: 'elasticsearch-next', name: 'os3', is_state_cluster: false },
                    { type: 'kafka', name: 'kafka-dev' },
                    { type: 's3', name: 'minio', is_asset_store: false },
                    { type: 's3', name: 'ceph', is_asset_store: true },
                ]
            });
        });

        it('should filter by name', async () => {
            const response = await request('GET', '/v2/cluster/connectors', {
                searchParams: { name: 'os2' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                connectors: [{ type: 'elasticsearch-next', name: 'os2', is_state_cluster: true }]
            });
        });

        it('should return the grouped-by-type view when groupBy=type', async () => {
            const response = await request('GET', '/v2/cluster/connectors', {
                searchParams: { groupBy: 'type' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                connectors: {
                    'elasticsearch-next': ['os2', 'os3'],
                    kafka: ['kafka-dev'],
                    s3: ['minio', 'ceph'],
                }
            });
        });

        it('should respond with a 400 for an unsupported groupBy', async () => {
            const response = await request('GET', '/v2/cluster/connectors', {
                searchParams: { groupBy: 'name' }
            });

            expect(response.statusCode).toEqual(400);
            expect(response.body.error).toEqual(400);
            expect(response.body.message).toContain('Invalid request query');
            expect(response.body.message).toContain('groupBy');
        });

        it('should respond with a 400 for an unknown query param', async () => {
            const response = await request('GET', '/v2/cluster/connectors', {
                searchParams: { group_by: 'type' }
            });

            expect(response.statusCode).toEqual(400);
            expect(response.body.message).toContain('Invalid request query');
            expect(response.body.message).toContain('Unrecognized key: "group_by"');
        });
    });

    describe('/v2/jobs', () => {
        const search = jest.fn<(...args: any[]) => Promise<any>>();
        const get = jest.fn<(...args: any[]) => Promise<any>>();
        const submitJob = jest.fn<(...args: any[]) => Promise<any>>();
        const updateJob = jest.fn<(...args: any[]) => Promise<any>>();
        const softDeleteJob = jest.fn<(...args: any[]) => Promise<any>>();
        const startJob = jest.fn<(...args: any[]) => Promise<any>>();
        const setActiveState = jest.fn<(...args: any[]) => Promise<any>>();
        const getLatestExecution = jest.fn<(...args: any[]) => Promise<any>>();

        beforeAll(() => {
            context.stores.jobsStorage.search = search;
            context.stores.jobsStorage.get = get;
            context.services.jobsService.submitJob = submitJob;
            context.services.jobsService.updateJob = updateJob;
            context.services.jobsService.softDeleteJob = softDeleteJob;
            context.services.jobsService.startJob = startJob;
            context.services.jobsService.setActiveState = setActiveState;
            context.services.jobsService.getLatestExecution = getLatestExecution;
        });

        beforeEach(() => {
            search.mockReset().mockResolvedValue([{ job_id: 'job-1' }]);
            get.mockReset().mockResolvedValue({ job_id: 'job-1' });
            submitJob.mockReset().mockResolvedValue({ job_id: 'job-1' });
            updateJob.mockReset().mockResolvedValue({ job_id: 'job-1' });
            softDeleteJob.mockReset().mockResolvedValue({ job_id: 'job-1', _deleted: true });
            startJob.mockReset().mockResolvedValue({ job_id: 'job-1', ex_id: 'ex-1' });
            setActiveState.mockReset().mockResolvedValue({ job_id: 'job-1' });
            getLatestExecution.mockReset().mockResolvedValue({ ex_id: 'ex-1' });
        });

        it('should search jobs with the default options', async () => {
            const response = await request('GET', '/v2/jobs', {
                searchParams: { active: 'true' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual([{ job_id: 'job-1' }]);
            expect(search).toHaveBeenCalledWith(
                `job_id:* AND !active:false AND ${notDeleted}`, 0, 100, '_updated:desc'
            );
        });

        it('should respond with a 400 for an invalid deleted option', async () => {
            const response = await request('GET', '/v2/jobs', {
                searchParams: { deleted: 'nope' }
            });

            expect(response.statusCode).toEqual(400);
            expect(search).not.toHaveBeenCalled();
        });

        it('should submit a job', async () => {
            const job = { name: 'test', operations: [{ _op: 'noop' }] };

            const response = await request('POST', '/v2/jobs', {
                json: job,
                searchParams: { start: 'false' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ job_id: 'job-1' });
            expect(submitJob).toHaveBeenCalledWith(job, false);
        });

        it('should respond with a 400 when no job is posted', async () => {
            const response = await request('POST', '/v2/jobs', { json: {} });

            expect(response.statusCode).toEqual(400);
            expect(response.body).toMatchObject({ message: 'No job was posted' });
            expect(submitJob).not.toHaveBeenCalled();
        });

        it('should return a job', async () => {
            const response = await request('GET', '/v2/jobs/job-1');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ job_id: 'job-1' });
            expect(get).toHaveBeenCalledWith('job-1');
        });

        it('should update a job', async () => {
            const job = { name: 'updated' };

            const response = await request('PUT', '/v2/jobs/job-1', { json: job });

            expect(response.statusCode).toEqual(200);
            expect(updateJob).toHaveBeenCalledWith('job-1', job);
        });

        it('should respond with a 400 when no update data is provided', async () => {
            const response = await request('PUT', '/v2/jobs/job-1', { json: {} });

            expect(response.statusCode).toEqual(400);
            expect(updateJob).not.toHaveBeenCalled();
        });

        it('should soft delete a job', async () => {
            const response = await request('DELETE', '/v2/jobs/job-1');

            expect(response.statusCode).toEqual(200);
            expect(softDeleteJob).toHaveBeenCalledWith('job-1');
        });

        it('should start a job', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_start');

            expect(response.statusCode).toEqual(200);
            expect(startJob).toHaveBeenCalledWith('job-1');
        });

        it('should set the active state of a job', async () => {
            await request('POST', '/v2/jobs/job-1/_active');
            await request('POST', '/v2/jobs/job-1/_inactive');

            expect(setActiveState).toHaveBeenNthCalledWith(1, 'job-1', true);
            expect(setActiveState).toHaveBeenNthCalledWith(2, 'job-1', false);
        });

        it('should return the latest execution of a job', async () => {
            const response = await request('GET', '/v2/jobs/job-1/ex');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ ex_id: 'ex-1' });
            expect(getLatestExecution).toHaveBeenCalledWith('job-1');
        });
    });

    describe('/v2/jobs/:jobId execution actions', () => {
        const exId = 'ex-1';

        const getLatestExecutionId = jest.fn<(...args: any[]) => Promise<any>>();
        const getExecutionContext = jest.fn<(...args: any[]) => Promise<any>>();
        const getTerminalStatuses = jest.fn<(...args: any[]) => any>();
        const stopExecution = jest.fn<(...args: any[]) => Promise<any>>();
        const pauseExecution = jest.fn<(...args: any[]) => Promise<any>>();
        const resumeExecution = jest.fn<(...args: any[]) => Promise<any>>();
        const addWorkers = jest.fn<(...args: any[]) => Promise<any>>();
        const setLogLevel = jest.fn<(...args: any[]) => Promise<any>>();
        const getControllerStats = jest.fn<(...args: any[]) => Promise<any>>();
        const getSliceTap = jest.fn<(...args: any[]) => Promise<any>>();
        const search = jest.fn<(...args: any[]) => Promise<any>>();

        beforeAll(() => {
            context.services.jobsService.getLatestExecutionId = getLatestExecutionId;
            context.services.executionService.getExecutionContext = getExecutionContext;
            context.stores.executionStorage.getTerminalStatuses = getTerminalStatuses;
            context.services.executionService.stopExecution = stopExecution;
            context.services.executionService.pauseExecution = pauseExecution;
            context.services.executionService.resumeExecution = resumeExecution;
            context.services.executionService.addWorkers = addWorkers;
            context.services.executionService.setLogLevel = setLogLevel;
            context.services.executionService.getControllerStats = getControllerStats;
            context.services.executionService.getSliceTap = getSliceTap;
            context.stores.stateStorage.search = search;
        });

        beforeEach(() => {
            getLatestExecutionId.mockReset().mockResolvedValue(exId);
            getExecutionContext.mockReset().mockResolvedValue({ _status: 'stopped' });
            getTerminalStatuses.mockReset().mockReturnValue(['completed', 'stopped']);
            stopExecution.mockReset();
            pauseExecution.mockReset().mockResolvedValue({ status: 'paused' });
            resumeExecution.mockReset().mockResolvedValue({ status: 'running' });
            addWorkers.mockReset().mockResolvedValue({ workerNum: 2, action: 'add', ex_id: exId });
            setLogLevel.mockReset();
            getControllerStats.mockReset().mockResolvedValue([{ ex_id: exId }]);
            getSliceTap.mockReset();
            search.mockReset().mockResolvedValue([{ state: 'error' }]);
        });

        it('should respond with a 404 when the job has no executions', async () => {
            getLatestExecutionId.mockResolvedValue(undefined);

            const response = await request('POST', '/v2/jobs/job-1/_pause');

            expect(response.statusCode).toEqual(404);
            expect(pauseExecution).not.toHaveBeenCalled();
        });

        it('should stop the latest execution', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_stop', {
                searchParams: { timeout: '1000' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ status: 'stopped' });
            expect(stopExecution).toHaveBeenCalledWith(exId, { timeout: 1000, force: false });
        });

        it('should not force stop when force=false', async () => {
            await request('POST', '/v2/jobs/job-1/_stop', {
                searchParams: { force: 'false' }
            });

            expect(stopExecution).toHaveBeenCalledWith(exId, { timeout: undefined, force: false });
        });

        it('should force stop when force=true', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_stop', {
                searchParams: { force: 'true' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                message: `Force stop complete for exId ${exId}`,
                status: 'stopped'
            });
            expect(stopExecution).toHaveBeenCalledWith(exId, { timeout: undefined, force: true });
        });

        it('should pause and resume the latest execution', async () => {
            await request('POST', '/v2/jobs/job-1/_pause');
            await request('POST', '/v2/jobs/job-1/_resume');

            expect(pauseExecution).toHaveBeenCalledWith(exId);
            expect(resumeExecution).toHaveBeenCalledWith(exId);
        });

        it('should change the worker count', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_workers', {
                searchParams: { add: '2' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ message: `2 workers have been add for execution: ${exId}` });
            expect(addWorkers).toHaveBeenCalledWith(exId, 2);
        });

        it('should respond with a 400 for an invalid worker option', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_workers', {
                searchParams: { add: 'nope' }
            });

            expect(response.statusCode).toEqual(400);
            expect(addWorkers).not.toHaveBeenCalled();
        });

        it('should set the log level', async () => {
            await request('POST', '/v2/jobs/job-1/_settings', {
                searchParams: { log_level: 'debug' }
            });

            expect(setLogLevel).toHaveBeenCalledWith(exId, 'debug');
        });

        it('should search errors for the latest execution', async () => {
            const response = await request('GET', '/v2/jobs/job-1/errors');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual([{ state: 'error' }]);
            expect(search).toHaveBeenCalledWith(
                `state:error AND ex_id:"${exId}"`, 0, 100, '_updated:desc'
            );
        });

        it('should return the controller stats for the latest execution', async () => {
            const response = await request('GET', '/v2/jobs/job-1/controller');

            expect(response.statusCode).toEqual(200);
            expect(getControllerStats).toHaveBeenCalledWith(exId);
        });

        it('should tap the latest execution', async () => {
            const tapResults = { workerId: 'some-worker', records: [] };
            getSliceTap.mockResolvedValue(Buffer.from(JSON.stringify(tapResults)));

            const response = await request('GET', '/v2/jobs/job-1/tap', {
                searchParams: { size: 'all' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toStartWith('application/json');
            expect(response.body).toEqual(tapResults);
            expect(getSliceTap).toHaveBeenCalledWith(exId, { size: 0 });
        });
    });

    describe('POST /v2/jobs/:jobId/_recover', () => {
        const recoverJob = jest.fn<(...args: any[]) => Promise<any>>();
        const getExecutionContext = jest.fn<(...args: any[]) => Promise<any>>();
        const recoverExecution = jest.fn<(...args: any[]) => Promise<any>>();

        beforeAll(() => {
            context.services.jobsService.recoverJob = recoverJob;
            context.services.executionService.getExecutionContext = getExecutionContext;
            context.services.executionService.recoverExecution = recoverExecution;
        });

        beforeEach(() => {
            recoverJob.mockReset().mockResolvedValue({ ex_id: 'ex-2' });
            getExecutionContext.mockReset().mockResolvedValue({ ex_id: 'ex-1', job_id: 'job-1' });
            recoverExecution.mockReset().mockResolvedValue({ ex_id: 'ex-2' });
        });

        it('should recover the job when no ex_id is given', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_recover', {
                searchParams: { cleanup_type: 'errors' }
            });

            expect(response.statusCode).toEqual(200);
            expect(recoverJob).toHaveBeenCalledWith('job-1', 'errors');
        });

        it('should recover a specific execution when ex_id is given', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_recover', {
                searchParams: { ex_id: 'ex-1' }
            });

            expect(response.statusCode).toEqual(200);
            expect(recoverExecution).toHaveBeenCalledWith('ex-1', undefined);
            expect(recoverJob).not.toHaveBeenCalled();
        });

        it('should respond with a 400 when the execution belongs to another job', async () => {
            getExecutionContext.mockResolvedValue({ ex_id: 'ex-1', job_id: 'other-job' });

            const response = await request('POST', '/v2/jobs/job-1/_recover', {
                searchParams: { ex_id: 'ex-1' }
            });

            expect(response.statusCode).toEqual(400);
            expect(response.body).toMatchObject({
                message: 'Execution ex-1 does not belong to job job-1'
            });
            expect(recoverExecution).not.toHaveBeenCalled();
        });

        it('should respond with a 400 for an invalid cleanup_type', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_recover', {
                searchParams: { cleanup_type: 'nope' }
            });

            expect(response.statusCode).toEqual(400);
            expect(recoverJob).not.toHaveBeenCalled();
        });

        it('should ignore the v1 cleanup alias', async () => {
            await request('POST', '/v2/jobs/job-1/_recover', {
                searchParams: { cleanup: 'errors' }
            });

            expect(recoverJob).toHaveBeenCalledWith('job-1', undefined);
        });
    });

    describe('GET /v2/ex', () => {
        const search = jest.fn<(...args: any[]) => Promise<any>>();
        const stateSearch = jest.fn<(...args: any[]) => Promise<any>>();
        const getExecutionContext = jest.fn<(...args: any[]) => Promise<any>>();
        const getLatestExecutionId = jest.fn<(...args: any[]) => Promise<any>>();

        beforeAll(() => {
            context.stores.executionStorage.search = search;
            context.stores.stateStorage.search = stateSearch;
            context.services.executionService.getExecutionContext = getExecutionContext;
            context.services.jobsService.getLatestExecutionId = getLatestExecutionId;
        });

        beforeEach(() => {
            search.mockReset().mockResolvedValue([{ ex_id: 'ex-1' }]);
            stateSearch.mockReset().mockResolvedValue([]);
            getExecutionContext.mockReset().mockResolvedValue({ ex_id: 'ex-1' });
            getLatestExecutionId.mockReset();
        });

        it('should filter by job_id and status', async () => {
            const response = await request('GET', '/v2/ex', {
                searchParams: { job_id: 'job-1', status: 'running,failing' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual([{ ex_id: 'ex-1' }]);
            expect(search).toHaveBeenCalledWith(
                `ex_id:* AND job_id:"job-1" AND (_status:"running" OR _status:"failing") AND ${notDeleted}`,
                0,
                100,
                '_updated:desc'
            );
        });

        it('should return an execution', async () => {
            const response = await request('GET', '/v2/ex/ex-1');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ ex_id: 'ex-1' });
            expect(getExecutionContext).toHaveBeenCalledWith('ex-1');
        });

        it('should search errors for an execution', async () => {
            const response = await request('GET', '/v2/ex/ex-1/errors', {
                searchParams: { size: '10' }
            });

            expect(response.statusCode).toEqual(200);
            expect(stateSearch).toHaveBeenCalledWith(
                'state:error AND ex_id:"ex-1"', 0, 10, '_updated:desc'
            );
            expect(getLatestExecutionId).not.toHaveBeenCalled();
        });
    });

    describe('routes removed from v2', () => {
        const pauseExecution = jest.fn<(...args: any[]) => Promise<any>>();
        const getControllerStats = jest.fn<(...args: any[]) => Promise<any>>();

        beforeAll(() => {
            context.services.executionService.pauseExecution = pauseExecution;
            context.services.executionService.getControllerStats = getControllerStats;
        });

        beforeEach(() => {
            pauseExecution.mockReset().mockResolvedValue({ status: 'paused' });
            getControllerStats.mockReset().mockResolvedValue([]);
        });

        it.each([
            ['POST', '/ex/ex-1/_stop'],
            ['POST', '/ex/ex-1/_pause'],
            ['POST', '/ex/ex-1/_resume'],
            ['POST', '/ex/ex-1/_workers'],
            ['POST', '/ex/ex-1/_recover'],
            ['GET', '/ex/ex-1/controller'],
            ['GET', '/ex/ex-1/tap'],
            ['GET', '/ex/ex-1/slicer'],
            ['GET', '/jobs/job-1/slicer'],
            ['GET', '/cluster/slicers'],
            ['GET', '/txt/jobs'],
        ])('%s /v2%s should respond with a 405', async (method, path) => {
            const response = await request(method, `/v2${path}`);

            expect(response.statusCode).toEqual(405);
        });

        // TODO: Teraslice v4 deletes /v1, remove this test
        // https://github.com/terascope/teraslice/issues/4584#issuecomment-6636093239
        it('should still serve the removed routes on /v1', async () => {
            const pause = await request('POST', '/v1/ex/ex-1/_pause');
            const slicers = await request('GET', '/v1/cluster/slicers');

            expect(pause.statusCode).toEqual(200);
            expect(slicers.statusCode).toEqual(200);
            expect(pauseExecution).toHaveBeenCalledWith('ex-1');
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
