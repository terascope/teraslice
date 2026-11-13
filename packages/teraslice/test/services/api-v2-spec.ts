import 'jest-extended';
import { jest } from '@jest/globals';
import got from 'got';
import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { TestContext, jobSchema } from '@terascope/job-components';
import { TSError } from '@terascope/core-utils';
import { TerasliceApiV2 } from '@terascope/types';
import { findPort } from '../../src/lib/utils/port_utils.js';
import { ApiService } from '../../src/lib/cluster/services/api/api.js';
import { createV2Registry } from '../../src/lib/cluster/services/api/v2/routes.js';
import { getPackageJSON } from '../../src/lib/utils/file_utils.js';

const dirname = nodePath.dirname(fileURLToPath(import.meta.url));

const notDeleted = '(_deleted:false OR (* AND -_deleted:*))';

const jobConfig = {
    name: 'test-job',
    active: true,
    analytics: true,
    assets: null,
    autorecover: false,
    lifecycle: 'persistent',
    max_retries: 3,
    operations: [
        { _op: 'test-reader', size: 10 },
        { _op: 'noop' },
    ],
    apis: [],
    probation_window: 300000,
    env_vars: {},
    log_level: null,
    slicers: 1,
    workers: 2,
    stateful: false,
    job_id: 'job-1',
    _created: '2026-11-05T00:00:00.000Z',
    _updated: '2026-11-05T00:00:00.000Z',
};
const job = { ...jobConfig, _context: 'job' };
const execution = {
    ...jobConfig,
    _context: 'ex',
    ex_id: 'ex-1',
    _status: 'running',
    _has_errors: false,
    _slicer_stats: {},
    metadata: {},
    slicer_port: 45680,
    slicer_hostname: 'localhost',
    teraslice_version: '3.0.0',
};
const sliceErrors = [{
    slice_id: 'slice-1',
    slicer_id: 0,
    slicer_order: 3,
    request: '{"count":10}',
    state: 'error',
    ex_id: 'ex-1',
    _created: '2026-11-05T00:00:00.000Z',
    _updated: '2026-11-05T00:00:01.000Z',
    error: 'Error: boom\n    at ...',
}];
const tapResult = {
    workerId: 'worker-1',
    sliceId: 'slice-1',
    // one array per operation, as the worker's tap observer collects them
    records: [
        [{ record: { id: 1 }, metadata: { _key: '1' } }],
        [{ record: { id: 1, seen: true }, metadata: { _key: '1' } }],
        [],
    ],
};
const newExecution = { job_id: 'job-1', ex_id: 'ex-2' };
const warning = {
    type: 'JobValidation',
    reason: {
        type: 'jobProperty',
        kind: 'deprecation',
        reason: { field: 'cpu', description: 'use resources_requests_cpu' },
    },
};

describe('HTTP API v2', () => {
    const { version } = getPackageJSON();

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

        it('should respond with a 400 for any query param', async () => {
            const response = await request('GET', '/v2', { searchParams: { foo: 'bar' } });

            expect(response.statusCode).toEqual(400);
            expect(response.body.message).toContain('Unrecognized key: "foo"');
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

        it('should keep the status of a controller stats error', async () => {
            getControllerStats.mockRejectedValue(new TSError('boom', { statusCode: 503 }));

            const response = await request('GET', '/v2/cluster/controllers');

            expect(response.statusCode).toEqual(503);
            expect(response.body.message).toContain('boom');
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

        it('should filter by type', async () => {
            const response = await request('GET', '/v2/cluster/connectors', {
                searchParams: { type: 'kafka' }
            });

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({
                connectors: [{ type: 'kafka', name: 'kafka-dev' }]
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

    describe('GET /v2/cluster/job-schema', () => {
        it('should return the version and a job JSON Schema', async () => {
            const response = await request('GET', '/v2/cluster/job-schema');

            expect(response.statusCode).toEqual(200);
            expect(response.body.version).toEqual(version);
            expect(response.body.job_schema).toMatchObject({
                $schema: 'http://json-schema.org/draft-07/schema#',
                $id: expect.any(String),
                title: 'Teraslice Job',
                description: expect.any(String),
                type: 'object',
                additionalProperties: false,
                definitions: {
                    operation: expect.any(Object),
                    api: expect.any(Object),
                },
            });
            expect(response.body.job_schema.required).toIncludeAllMembers(['name', 'operations']);
            expect(response.body.job_schema.properties).toContainKeys(['name', 'operations', 'apis']);
        });

        it('should match the response schema', async () => {
            const response = await request('GET', '/v2/cluster/job-schema');

            // responses aren't parsed at runtime, so check the envelope here
            const result = TerasliceApiV2.JobSchemaResponseSchema.safeParse(response.body);
            expect(result.error).toBeUndefined();
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
        const getJobWithExInfo = jest.fn<(...args: any[]) => Promise<any>>();
        const getJobsWithExInfo = jest.fn<(...args: any[]) => Promise<any>>();

        beforeAll(() => {
            context.stores.jobsStorage.search = search;
            context.stores.jobsStorage.get = get;
            context.services.jobsService.submitJob = submitJob;
            context.services.jobsService.updateJob = updateJob;
            context.services.jobsService.softDeleteJob = softDeleteJob;
            context.services.jobsService.startJob = startJob;
            context.services.jobsService.setActiveState = setActiveState;
            context.services.jobsService.getLatestExecution = getLatestExecution;
            context.services.jobsService.getJobWithExInfo = getJobWithExInfo;
            context.services.jobsService.getJobsWithExInfo = getJobsWithExInfo;
        });

        beforeEach(() => {
            search.mockReset().mockResolvedValue([job]);
            get.mockReset().mockResolvedValue({ job_id: 'job-1' });
            submitJob.mockReset().mockResolvedValue({ job_id: 'job-1' });
            updateJob.mockReset().mockResolvedValue({ job_id: 'job-1' });
            softDeleteJob.mockReset().mockResolvedValue({ job_id: 'job-1', _deleted: true });
            startJob.mockReset().mockResolvedValue({ job_id: 'job-1', ex_id: 'ex-1' });
            setActiveState.mockReset().mockResolvedValue({ job_id: 'job-1' });
            getLatestExecution.mockReset().mockResolvedValue({ ex_id: 'ex-1' });
            getJobWithExInfo.mockReset();
            getJobsWithExInfo.mockReset();
        });

        describe('GET /v2/jobs', () => {
            it('should search jobs with the default options', async () => {
                const response = await request('GET', '/v2/jobs');

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual([job]);
                expect(search).toHaveBeenCalledWith(
                    `job_id:* AND ${notDeleted}`, 0, 100, '_updated:desc'
                );
            });

            it('should filter active jobs for active=true', async () => {
                const response = await request('GET', '/v2/jobs', {
                    searchParams: { active: 'true' }
                });

                expect(response.statusCode).toEqual(200);
                expect(search).toHaveBeenCalledWith(
                    `job_id:* AND !active:false AND ${notDeleted}`, 0, 100, '_updated:desc'
                );
            });

            it('should pass paging, sort, active, deleted and filter through', async () => {
                const response = await request('GET', '/v2/jobs', {
                    searchParams: {
                        size: '5', from: '10', sort: 'name:asc', active: 'false', deleted: 'true',
                        filter: 'name:foo',
                    }
                });

                expect(response.statusCode).toEqual(200);
                expect(search).toHaveBeenCalledWith(
                    '(job_id:* AND active:false AND _deleted:true) AND (name:foo)', 10, 5, 'name:asc'
                );
            });

            it('should add the latest execution with only the fields in ?ex', async () => {
                getJobsWithExInfo.mockResolvedValue([{ ...job, ex: { _status: 'running' } }]);

                const response = await request('GET', '/v2/jobs', { searchParams: { ex: '_status' } });

                expect(response.statusCode).toEqual(200);
                expect(response.body[0].ex).toEqual({ _status: 'running' });
                expect(getJobsWithExInfo).toHaveBeenCalledWith(
                    expect.any(String), 0, 100, '_updated:desc', ['_status']
                );
            });

            it('should add every execution field for an empty ?ex', async () => {
                getJobsWithExInfo.mockResolvedValue([{ ...job, ex: execution }]);

                await request('GET', '/v2/jobs', { searchParams: { ex: '' } });

                expect(getJobsWithExInfo).toHaveBeenCalledWith(
                    expect.any(String), 0, 100, '_updated:desc', undefined
                );
            });

            it('should leave large pages to the search cluster\'s max_result_window', async () => {
                const response = await request('GET', '/v2/jobs', { searchParams: { size: '50000' } });

                expect(response.statusCode).toEqual(200);
                expect(search.mock.calls[0][2]).toBe(50000);
            });

            it('should use the default sort for an empty ?sort, like v1', async () => {
                await request('GET', '/v2/jobs', { searchParams: { sort: '' } });

                expect(search.mock.calls[0][3]).toBe('_updated:desc');
            });

            it.each([
                'name',
                'name:desc',
                '_created:asc,name',
            ])('should accept sort=%j', async (sort) => {
                const response = await request('GET', '/v2/jobs', { searchParams: { sort } });

                expect(response.statusCode).toEqual(200);
                expect(search.mock.calls[0][3]).toBe(sort);
            });

            it.each([
                ['sort', '_updated:sideways'],
                ['sort', 'name:'],
                ['sort', 'name:ASC'],
                ['sort', 'name:asc,'],
                ['sort', ':asc'],
                ['sort', 'a:b:asc'],
                ['size', 'ten'],
                ['size', '-1'],
                ['size', '1.5'],
                ['from', '-1'],
                ['from', '2.5'],
                ['active', ''],
                ['deleted', 'nope'],
            ])('should respond with a 400 for %s=%j', async (key, value) => {
                const response = await request('GET', '/v2/jobs', { searchParams: { [key]: value } });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toContain('Invalid request query');
                expect(response.body.message).toContain(key);
                expect(search).not.toHaveBeenCalled();
            });
        });

        describe('POST /v2/jobs', () => {
            const jobSpec = { name: 'test', operations: [{ _op: 'test-reader' }, { _op: 'noop' }] };

            it('should submit and start a job by default', async () => {
                submitJob.mockResolvedValue(newExecution);

                const response = await request('POST', '/v2/jobs', { json: jobSpec });

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual(newExecution);
                expect(submitJob).toHaveBeenCalledWith(jobSpec, true);
            });

            it('should only store the job for start=false', async () => {
                const response = await request('POST', '/v2/jobs', {
                    json: jobSpec,
                    searchParams: { start: 'false' }
                });

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({ job_id: 'job-1' });
                expect(submitJob).toHaveBeenCalledWith(jobSpec, false);
            });

            it('should pass the job through as sent, for the job validator', async () => {
                // extra keys are kept, and values the job schema coerces aren't checked here
                const sent = { ...jobSpec, workers: '5', __metadata: { cli: { cluster: 'localhost:5678' } } };

                const response = await request('POST', '/v2/jobs', { json: sent });

                expect(response.statusCode).toEqual(200);
                expect(submitJob).toHaveBeenCalledWith(sent, true);
            });

            it('should keep the status of a job validation error', async () => {
                submitJob.mockRejectedValue(
                    new TSError('Job cannot include a job_id on submit', { statusCode: 422 })
                );

                const response = await request('POST', '/v2/jobs', {
                    json: { ...jobSpec, job_id: 'job-1' }
                });

                expect(response.statusCode).toEqual(422);
                expect(response.body.message).toContain('job_id');
            });

            it.each([
                ['no body', undefined, 'expected object'],
                ['an empty body', {}, 'operations'],
                ['no operations', { name: 'test' }, 'operations'],
                ['an operation without _op', { operations: [{ _op: 'noop' }, { size: 1 }] }, '_op'],
            ])('should respond with a 400 for %s', async (_desc, body, expected) => {
                const response = await request('POST', '/v2/jobs', { json: body });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toContain('Invalid request body');
                expect(response.body.message).toContain(expected);
                expect(submitJob).not.toHaveBeenCalled();
            });

            it.each([
                ['start', ''],
                ['start', 'nope'],
                ['run', 'true'],
            ])('should respond with a 400 for %s=%j', async (key, value) => {
                const response = await request('POST', '/v2/jobs', {
                    json: jobSpec,
                    searchParams: { [key]: value }
                });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toContain('Invalid request query');
                expect(submitJob).not.toHaveBeenCalled();
            });
        });

        describe('GET /v2/jobs/:jobId', () => {
            it('should return a job', async () => {
                const response = await request('GET', '/v2/jobs/job-1');

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({ job_id: 'job-1' });
                expect(get).toHaveBeenCalledWith('job-1');
            });

            it('should add the latest execution with only the fields in ?ex', async () => {
                getJobWithExInfo.mockResolvedValue({
                    ...job, ex: { ex_id: 'ex-1', _status: 'running' }
                });

                const response = await request('GET', '/v2/jobs/job-1', {
                    searchParams: { ex: 'ex_id, _status' }
                });

                expect(response.statusCode).toEqual(200);
                expect(response.body.ex).toEqual({ ex_id: 'ex-1', _status: 'running' });
                expect(getJobWithExInfo).toHaveBeenCalledWith('job-1', ['ex_id', '_status']);
            });

            it('should add every execution field for an empty ?ex', async () => {
                getJobWithExInfo.mockResolvedValue({ ...job, ex: execution });

                const response = await request('GET', '/v2/jobs/job-1', {
                    searchParams: { ex: '' }
                });

                expect(response.statusCode).toEqual(200);
                expect(response.body.ex).toEqual(execution);
                expect(getJobWithExInfo).toHaveBeenCalledWith('job-1', undefined);
            });

            it('should respond with a 400 for an unknown query param', async () => {
                const response = await request('GET', '/v2/jobs/job-1', {
                    searchParams: { exe: '_status' }
                });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toContain('Unrecognized key: "exe"');
            });

            it('should keep the status of a storage error', async () => {
                get.mockRejectedValue(new TSError('Not Found', { statusCode: 404 }));

                const response = await request('GET', '/v2/jobs/missing');

                expect(response.statusCode).toEqual(404);
            });
        });

        describe('PUT /v2/jobs/:jobId', () => {
            const update = { name: 'updated', operations: [{ _op: 'test-reader' }, { _op: 'noop' }] };

            it('should update a job', async () => {
                updateJob.mockResolvedValue({ ...job, ...update, warnings: [warning] });

                const response = await request('PUT', '/v2/jobs/job-1', { json: update });

                expect(response.statusCode).toEqual(200);
                expect(response.body).toMatchObject({ name: 'updated', warnings: [warning] });
                expect(updateJob).toHaveBeenCalledWith('job-1', update);
            });

            it.each([
                ['an empty body', {}],
                // v1 stored this as the whole job, dropping its operations
                ['only active: false', { active: false }],
            ])('should respond with a 400 for %s', async (_desc, body) => {
                const response = await request('PUT', '/v2/jobs/job-1', { json: body });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toContain('Invalid request body');
                expect(updateJob).not.toHaveBeenCalled();
            });

            it('should keep the status of an update error', async () => {
                updateJob.mockRejectedValue(
                    new TSError('Job job-1 has been deleted and cannot be updated.', { statusCode: 410 })
                );

                const response = await request('PUT', '/v2/jobs/job-1', { json: update });

                expect(response.statusCode).toEqual(410);
            });
        });

        it('should soft delete a job', async () => {
            const response = await request('DELETE', '/v2/jobs/job-1');

            expect(response.statusCode).toEqual(200);
            expect(softDeleteJob).toHaveBeenCalledWith('job-1');
        });

        it('should keep the status of a soft delete error', async () => {
            softDeleteJob.mockRejectedValue(
                new TSError('Job job-1 is currently running', { statusCode: 409 })
            );

            const response = await request('DELETE', '/v2/jobs/job-1');

            expect(response.statusCode).toEqual(409);
            expect(response.body.message).toContain('currently running');
        });

        it('should start a job', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_start');

            expect(response.statusCode).toEqual(200);
            expect(startJob).toHaveBeenCalledWith('job-1');
        });

        it('should respond with a 400 for any query param on _start', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_start', {
                searchParams: { force: 'true' }
            });

            expect(response.statusCode).toEqual(400);
            expect(startJob).not.toHaveBeenCalled();
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

        it('should respond with a 404 when the job has no latest execution', async () => {
            getLatestExecution.mockRejectedValue(
                new TSError('No execution was found for job job-1', { statusCode: 404 })
            );

            const response = await request('GET', '/v2/jobs/job-1/ex');

            expect(response.statusCode).toEqual(404);
            expect(response.body.message).toContain('No execution was found');
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
        const removeWorkers = jest.fn<(...args: any[]) => Promise<any>>();
        const setWorkers = jest.fn<(...args: any[]) => Promise<any>>();
        const setLogLevel = jest.fn<(...args: any[]) => Promise<any>>();
        const getControllerStats = jest.fn<(...args: any[]) => Promise<any>>();
        const getSliceTap = jest.fn<(...args: any[]) => Promise<any>>();
        const search = jest.fn<(...args: any[]) => Promise<any>>();

        const workerMocks = { add: addWorkers, remove: removeWorkers, total: setWorkers };
        const workerCalls = () => Object.values(workerMocks).flatMap((mock) => mock.mock.calls);

        beforeAll(() => {
            context.services.jobsService.getLatestExecutionId = getLatestExecutionId;
            context.services.executionService.getExecutionContext = getExecutionContext;
            context.stores.executionStorage.getTerminalStatuses = getTerminalStatuses;
            context.services.executionService.stopExecution = stopExecution;
            context.services.executionService.pauseExecution = pauseExecution;
            context.services.executionService.resumeExecution = resumeExecution;
            context.services.executionService.addWorkers = addWorkers;
            context.services.executionService.removeWorkers = removeWorkers;
            context.services.executionService.setWorkers = setWorkers;
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
            for (const [action, mock] of Object.entries(workerMocks)) {
                mock.mockReset().mockImplementation(
                    async (id: string, workerNum: number) => ({ workerNum, action, ex_id: id })
                );
            }
            setLogLevel.mockReset();
            getControllerStats.mockReset().mockResolvedValue([{ ex_id: exId }]);
            getSliceTap.mockReset().mockResolvedValue(Buffer.from(JSON.stringify(tapResult)));
            search.mockReset().mockResolvedValue(sliceErrors);
        });

        it.each([
            ['POST', '/_pause'],
            ['POST', '/_stop'],
            ['GET', '/controller'],
        ])('%s /v2/jobs/job-1%s should respond with a 404 when the job has no executions', async (method, path) => {
            getLatestExecutionId.mockResolvedValue(undefined);

            const response = await request(method, `/v2/jobs/job-1${path}`);

            expect(response.statusCode).toEqual(404);
            expect(response.body.message).toContain('No executions were found for job: job-1');
            expect(pauseExecution).not.toHaveBeenCalled();
            expect(stopExecution).not.toHaveBeenCalled();
            expect(getControllerStats).not.toHaveBeenCalled();
        });

        describe('POST /v2/jobs/:jobId/_stop', () => {
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

                expect(stopExecution).toHaveBeenCalledWith(
                    exId, { timeout: undefined, force: false }
                );
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
                expect(stopExecution).toHaveBeenCalledWith(
                    exId, { timeout: undefined, force: true }
                );
            });

            it('should return the current status right away for blocking=false', async () => {
                getExecutionContext.mockResolvedValue({ _status: 'stopping' });

                const response = await request('POST', '/v2/jobs/job-1/_stop', {
                    searchParams: { blocking: 'false' }
                });

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({ status: 'stopping' });
            });

            it.each([
                ['timeout', '-1'],
                ['timeout', 'soon'],
                ['force', 'maybe'],
                ['blocking', ''],
            ])('should respond with a 400 for %s=%j', async (key, value) => {
                const response = await request('POST', '/v2/jobs/job-1/_stop', {
                    searchParams: { [key]: value }
                });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toContain(key);
                expect(stopExecution).not.toHaveBeenCalled();
            });
        });

        it('should pause and resume the latest execution', async () => {
            await request('POST', '/v2/jobs/job-1/_pause');
            await request('POST', '/v2/jobs/job-1/_resume');

            expect(pauseExecution).toHaveBeenCalledWith(exId);
            expect(resumeExecution).toHaveBeenCalledWith(exId);
        });

        describe('POST /v2/jobs/:jobId/_workers', () => {
            it.each(['add', 'remove', 'total'] as const)('should change the worker count with %s', async (key) => {
                const response = await request('POST', '/v2/jobs/job-1/_workers', {
                    searchParams: { [key]: '2' }
                });

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({
                    message: `2 workers have been ${key} for execution: ${exId}`
                });
                expect(workerMocks[key]).toHaveBeenCalledWith(exId, 2);
                expect(workerCalls()).toHaveLength(1);
            });

            // like v1: on kubernetesV2 this scales the workers to none
            it('should allow total=0', async () => {
                const response = await request('POST', '/v2/jobs/job-1/_workers', {
                    searchParams: { total: '0' }
                });

                expect(response.statusCode).toEqual(200);
                expect(setWorkers).toHaveBeenCalledExactlyOnceWith(exId, 0);
            });

            // like v1 (Number('') is 0)
            it('should treat an empty total as 0', async () => {
                await request('POST', '/v2/jobs/job-1/_workers', { searchParams: { total: '' } });

                expect(setWorkers).toHaveBeenCalledExactlyOnceWith(exId, 0);
            });

            it.each([
                [{}, 'exactly one'],
                [{ add: '1', total: '3' }, 'exactly one'],
                [{ add: '0' }, 'add'],
                [{ add: 'nope' }, 'add'],
                [{ add: '' }, 'add'],
                [{ remove: 'two' }, 'remove'],
                [{ total: '1.5' }, 'total'],
                [{ count: '2' }, 'Unrecognized key: "count"'],
            ])('should respond with a 400 for %j', async (searchParams, message) => {
                const response = await request('POST', '/v2/jobs/job-1/_workers', { searchParams });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toContain(message);
                expect(workerCalls()).toBeEmpty();
            });
        });

        describe('POST /v2/jobs/:jobId/_settings', () => {
            it('should set the log level', async () => {
                await request('POST', '/v2/jobs/job-1/_settings', {
                    searchParams: { log_level: 'debug' }
                });

                expect(setLogLevel).toHaveBeenCalledWith(exId, 'debug');
            });

            it.each<Record<string, string>>([{}, { log_level: 'loud' }])(
                'should respond with a 400 for %j',
                async (searchParams) => {
                    const response = await request('POST', '/v2/jobs/job-1/_settings', { searchParams });

                    expect(response.statusCode).toEqual(400);
                    expect(response.body.message).toContain('log_level');
                    expect(setLogLevel).not.toHaveBeenCalled();
                }
            );
        });

        it('should search errors for the latest execution', async () => {
            const response = await request('GET', '/v2/jobs/job-1/errors');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual(sliceErrors);
            expect(search).toHaveBeenCalledWith(
                `state:error AND ex_id:"${exId}"`, 0, 100, '_updated:desc'
            );
        });

        it('should return the controller stats for the latest execution', async () => {
            const response = await request('GET', '/v2/jobs/job-1/controller');

            expect(response.statusCode).toEqual(200);
            expect(getControllerStats).toHaveBeenCalledWith(exId);
        });

        describe('GET /v2/jobs/:jobId/tap', () => {
            it('should send the tap results as JSON with the default size', async () => {
                const response = await request('GET', '/v2/jobs/job-1/tap');

                expect(response.statusCode).toEqual(200);
                expect(response.headers['content-type']).toStartWith('application/json');
                expect(response.body).toEqual(tapResult);
                expect(getSliceTap).toHaveBeenCalledWith(exId, { size: 10 });
            });

            it.each(['all', '0'])('should tap every record for size=%j', async (size) => {
                const response = await request('GET', '/v2/jobs/job-1/tap', { searchParams: { size } });

                expect(response.statusCode).toEqual(200);
                expect(getSliceTap).toHaveBeenCalledWith(exId, { size: 0 });
            });

            it.each(['', '-1', 'some', '1.5'])('should respond with a 400 for size=%j', async (size) => {
                const response = await request('GET', '/v2/jobs/job-1/tap', { searchParams: { size } });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toContain('size');
                expect(getSliceTap).not.toHaveBeenCalled();
            });
        });
    });

    describe('POST /v2/jobs/:jobId/_recover', () => {
        const recoverJob = jest.fn<(...args: any[]) => Promise<any>>();
        const getExecutionContext = jest.fn<(...args: any[]) => Promise<any>>();
        const recoverExecution = jest.fn<(...args: any[]) => Promise<any>>();
        const assertJobCanRun = jest.fn<(...args: any[]) => Promise<void>>();
        const recoverFrom = { ex_id: 'ex-1', job_id: 'job-1' };

        beforeAll(() => {
            context.services.jobsService.recoverJob = recoverJob;
            context.services.jobsService.assertJobCanRun = assertJobCanRun;
            context.services.executionService.getExecutionContext = getExecutionContext;
            context.services.executionService.recoverExecution = recoverExecution;
        });

        beforeEach(() => {
            recoverJob.mockReset().mockResolvedValue(newExecution);
            assertJobCanRun.mockReset().mockResolvedValue(undefined);
            getExecutionContext.mockReset().mockResolvedValue(recoverFrom);
            recoverExecution.mockReset().mockResolvedValue(newExecution);
        });

        it('should recover the job with no cleanup type', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_recover');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual(newExecution);
            expect(recoverJob).toHaveBeenCalledWith('job-1', undefined);
        });

        it('should recover the job with a cleanup type', async () => {
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
            expect(assertJobCanRun).toHaveBeenCalledWith('job-1');
            expect(recoverExecution).toHaveBeenCalledWith(recoverFrom, undefined);
            expect(recoverJob).not.toHaveBeenCalled();
        });

        it('should respond with a 409 and not recover when ex_id is given and the job can\'t run', async () => {
            assertJobCanRun.mockRejectedValue(new TSError(
                'Job job-1 is currently running, cannot have the same job concurrently running',
                { statusCode: 409 }
            ));

            const response = await request('POST', '/v2/jobs/job-1/_recover', {
                searchParams: { ex_id: 'ex-1' }
            });

            expect(response.statusCode).toEqual(409);
            expect(response.body.message).toContain('currently running');
            expect(recoverExecution).not.toHaveBeenCalled();
        });

        it('should pass through a 409 from recoverJob', async () => {
            recoverJob.mockRejectedValue(new TSError(
                'There are orphaned resources for job: job-1, exId: ex-0. Please wait for Kubernetes to clean up orphaned resources.',
                { statusCode: 409 }
            ));

            const response = await request('POST', '/v2/jobs/job-1/_recover');

            expect(response.statusCode).toEqual(409);
            expect(response.body.message).toContain('orphaned resources');
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

        it.each(['', 'nope'])('should respond with a 400 for cleanup_type=%j', async (cleanupType) => {
            const response = await request('POST', '/v2/jobs/job-1/_recover', {
                searchParams: { cleanup_type: cleanupType }
            });

            expect(response.statusCode).toEqual(400);
            expect(response.body.message).toContain('cleanup_type');
            expect(recoverJob).not.toHaveBeenCalled();
        });

        it('should reject the v1 cleanup alias', async () => {
            const response = await request('POST', '/v2/jobs/job-1/_recover', {
                searchParams: { cleanup: 'errors' }
            });

            expect(response.statusCode).toEqual(400);
            expect(response.body.message).toContain('Unrecognized key: "cleanup"');
            expect(recoverJob).not.toHaveBeenCalled();
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
            search.mockReset().mockResolvedValue([execution]);
            stateSearch.mockReset().mockResolvedValue(sliceErrors);
            getExecutionContext.mockReset().mockResolvedValue(execution);
            getLatestExecutionId.mockReset();
        });

        it('should list executions with the default search options', async () => {
            const response = await request('GET', '/v2/ex');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual([execution]);
            expect(search).toHaveBeenCalledWith(
                `ex_id:* AND ${notDeleted}`, 0, 100, '_updated:desc'
            );
        });

        it('should filter by job_id and status', async () => {
            const response = await request('GET', '/v2/ex', {
                searchParams: { job_id: 'job-1', status: 'running,failing' }
            });

            expect(response.statusCode).toEqual(200);
            expect(search).toHaveBeenCalledWith(
                `ex_id:* AND job_id:"job-1" AND (_status:"running" OR _status:"failing") AND ${notDeleted}`,
                0,
                100,
                '_updated:desc'
            );
        });

        it('should pass an unknown status through, like v1, so it matches nothing', async () => {
            const response = await request('GET', '/v2/ex', { searchParams: { status: 'borked' } });

            expect(response.statusCode).toEqual(200);
            expect(search.mock.calls[0][0]).toContain('_status:"borked"');
        });

        describe('GET /v2/ex/:exId', () => {
            it('should return an execution', async () => {
                const response = await request('GET', '/v2/ex/ex-1');

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual(execution);
                expect(getExecutionContext).toHaveBeenCalledWith('ex-1');
            });

            it('should respond with a 400 for any query param', async () => {
                const response = await request('GET', '/v2/ex/ex-1', { searchParams: { ex: '_status' } });

                expect(response.statusCode).toEqual(400);
                expect(getExecutionContext).not.toHaveBeenCalled();
            });
        });

        describe('GET /v2/ex/:exId/errors', () => {
            it('should search errors for an execution with size and filter', async () => {
                const response = await request('GET', '/v2/ex/ex-2/errors', {
                    searchParams: { size: '10', filter: 'slicer_id:1' }
                });

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual(sliceErrors);
                expect(stateSearch).toHaveBeenCalledWith(
                    '(state:error AND ex_id:"ex-2") AND (slicer_id:1)', 0, 10, '_updated:desc'
                );
                expect(getLatestExecutionId).not.toHaveBeenCalled();
            });

            it('should respond with a 400 for an unknown query param', async () => {
                const response = await request('GET', '/v2/ex/ex-2/errors', {
                    searchParams: { state: 'error' }
                });

                expect(response.statusCode).toEqual(400);
                expect(stateSearch).not.toHaveBeenCalled();
            });
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

    // responses aren't parsed at runtime, so check the fixtures the mocked
    // routes above return are realistic
    describe('response fixtures', () => {
        it('should match the response schemas', () => {
            expect(TerasliceApiV2.JobWithExecutionSchema.safeParse(job).error).toBeUndefined();
            expect(TerasliceApiV2.ExecutionRecordSchema.safeParse(execution).error).toBeUndefined();
            expect(TerasliceApiV2.SliceErrorListSchema.safeParse(sliceErrors).error)
                .toBeUndefined();
            expect(TerasliceApiV2.SliceTapResultSchema.safeParse(tapResult).error).toBeUndefined();
            expect(TerasliceApiV2.NewExecutionSchema.safeParse(
                { ...newExecution, warnings: [warning] }
            ).error).toBeUndefined();
            expect(TerasliceApiV2.UpdatedJobSchema.safeParse(
                { ...job, warnings: [warning] }
            ).error).toBeUndefined();
            expect(TerasliceApiV2.SubmitJobResultSchema.safeParse(
                { ...newExecution, warnings: [warning] }
            ).error).toBeUndefined();
            expect(TerasliceApiV2.SubmitJobResultSchema.safeParse({ job_id: 'job-1' }).error)
                .toBeUndefined();
        });

        it('should accept a job submitted without a name', () => {
            // the job schema defaults name, and jobs are stored as submitted
            const { name: _name, ...noName } = job;

            expect(TerasliceApiV2.JobRecordSchema.safeParse(noName).error).toBeUndefined();
        });

        it('should accept a job stored as submitted, without defaults and with extra keys', () => {
            // submitJob stores the raw spec, so only what the client sent is there
            const submitted = {
                name: 'minimal-job',
                operations: [{ _op: 'test-reader' }, { _op: 'noop' }],
                __metadata: { cli: { cluster: 'local' } },
                job_id: 'job-2',
                _context: 'job',
                _created: '2026-11-05T00:00:00.000Z',
                _updated: '2026-11-05T00:00:00.000Z',
            };

            const result = TerasliceApiV2.JobWithExecutionSchema.safeParse(submitted);
            expect(result.error).toBeUndefined();
            expect(result.data).toHaveProperty('__metadata');
        });
    });

    // jobConfigShape in @terascope/types lists the job config fields by hand
    // (see "Job field docs: single source" in the plan); keep it in step with
    // the convict job schema, which is the source of truth
    describe('job config fields', () => {
        const recordOnlyKeys = ['job_id', '_context', '_created', '_updated', '_deleted', '_deleted_on'];
        // config fields teraslice sets itself, so the job schema doesn't accept them
        const systemSetKeys = ['relocatable'];
        const zodKeys = Object.keys(TerasliceApiV2.JobRecordSchema.shape)
            .filter((key) => !recordOnlyKeys.includes(key) && !systemSetKeys.includes(key));

        it.each(['native', 'kubernetesV2'])('should match the %s job schema', (clusteringType) => {
            const ctx = new TestContext('job-config-fields') as any;
            ctx.sysconfig.teraslice.cluster_manager_type = clusteringType;
            const convictKeys = Object.keys(jobSchema(ctx));

            if (clusteringType === 'kubernetesV2') {
                expect(zodKeys.toSorted()).toEqual(convictKeys.toSorted());
            } else {
                // native: zod lists the kubernetesV2-only fields too
                expect(zodKeys).toIncludeAllMembers(convictKeys);
            }
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

        // A schema written inline in routes.ts gives clients no type, so they'd
        // write their own copy that can drift.
        it('should all be named exports of @terascope/types', () => {
            const { routes } = createV2Registry(api);
            const exported = new Set<unknown>(Object.values(TerasliceApiV2));

            const inline: string[] = [];
            for (const route of routes) {
                for (const part of ['params', 'query', 'body', 'response'] as const) {
                    const schema = route[part];
                    if (schema && !exported.has(schema)) {
                        inline.push(`${route.method.toUpperCase()} ${route.path} ${part}`);
                    }
                }
            }

            expect(inline).toEqual([]);
        });
    });

    // api/api.ts imports createV2Registry from v2/routes.ts, so a runtime
    // import back from api/api.ts would be a cycle that breaks as soon as
    // either module uses the other at load time
    describe('v2 routes module', () => {
        it('should only import types from api/api.ts', () => {
            const routesPath = nodePath.join(dirname, '../../src/lib/cluster/services/api/v2/routes.ts');
            const source = fs.readFileSync(routesPath, 'utf8');
            const apiImports = source.match(/^import\b[^;]*?from '\.\.\/api\.js';/gms) ?? [];

            expect(apiImports).not.toBeEmpty();
            for (const statement of apiImports) {
                expect(statement).toStartWith('import type ');
            }
        });
    });
});
