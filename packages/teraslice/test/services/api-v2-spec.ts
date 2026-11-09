import 'jest-extended';
import { jest } from '@jest/globals';
import got from 'got';
import express from 'express';
import http from 'node:http';
import { z } from 'zod';
import { TestContext, jobSchema } from '@terascope/job-components';
import { TSError } from '@terascope/core-utils';
import { TerasliceApiV2 } from '@terascope/types';
import { findPort } from '../../src/lib/utils/port_utils.js';
import { ApiService } from '../../src/lib/cluster/services/api/api.js';
import { createV2Registry } from '../../src/lib/cluster/services/api/v2/routes.js';
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

        it('should keep the status of a controller stats error', async () => {
            getControllerStats.mockRejectedValue(new TSError('boom', { statusCode: 503 }));

            const response = await request('GET', '/v2/cluster/controllers');

            expect(response.statusCode).toEqual(503);
            expect(response.body.message).toContain('boom');
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

    describe('job and execution reads', () => {
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

        it('should have fixtures that match the response schemas', () => {
            // the routes below return these as-is, so check they're realistic
            expect(TerasliceApiV2.JobWithExecutionSchema.safeParse(job).error).toBeUndefined();
            expect(TerasliceApiV2.ExecutionRecordSchema.safeParse(execution).error).toBeUndefined();
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

        describe('GET /v2/jobs/:jobId', () => {
            it('should add the latest execution with only the fields in ?ex', async () => {
                const getJobWithExInfo = jest.fn(async () => ({
                    ...job, ex: { ex_id: 'ex-1', _status: 'running' }
                }));
                context.services.jobsService.getJobWithExInfo = getJobWithExInfo;

                const response = await request('GET', '/v2/jobs/job-1', {
                    searchParams: { ex: 'ex_id, _status' }
                });

                expect(response.statusCode).toEqual(200);
                expect(response.body.ex).toEqual({ ex_id: 'ex-1', _status: 'running' });
                expect(getJobWithExInfo).toHaveBeenCalledWith('job-1', ['ex_id', '_status']);
            });

            it('should add every execution field for an empty ?ex', async () => {
                const getJobWithExInfo = jest.fn(async () => ({ ...job, ex: execution }));
                context.services.jobsService.getJobWithExInfo = getJobWithExInfo;

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
                context.stores.jobsStorage.get = async () => {
                    throw new TSError('Not Found', { statusCode: 404 });
                };

                const response = await request('GET', '/v2/jobs/missing');

                expect(response.statusCode).toEqual(404);
            });
        });

        it('GET /v2/jobs/:jobId/ex should respond with a 404 when the job has no execution', async () => {
            context.services.jobsService.getLatestExecution = async () => {
                throw new TSError('No execution was found for job job-1', { statusCode: 404 });
            };

            const response = await request('GET', '/v2/jobs/job-1/ex');

            expect(response.statusCode).toEqual(404);
            expect(response.body.message).toContain('No execution was found');
        });

        it('GET /v2/jobs/:jobId/controller should respond with a 404 when the job has no execution', async () => {
            context.services.jobsService.getLatestExecutionId = async () => undefined;

            const response = await request('GET', '/v2/jobs/job-1/controller');

            expect(response.statusCode).toEqual(404);
            expect(response.body.message).toContain('No executions were found for job: job-1');
        });

        it('GET /v2/ex/:exId should respond with a 400 for any query param', async () => {
            const response = await request('GET', '/v2/ex/ex-1', { searchParams: { ex: '_status' } });

            expect(response.statusCode).toEqual(400);
        });

        describe('GET /v2/jobs', () => {
            let search: jest.Mock<(...args: any[]) => Promise<any[]>>;

            beforeEach(() => {
                search = jest.fn(async () => [job]);
                context.stores.jobsStorage.search = search;
            });

            it('should list jobs with the default search options', async () => {
                const response = await request('GET', '/v2/jobs');

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual([job]);
                expect(search).toHaveBeenCalledWith(
                    `job_id:* AND ${notDeleted}`, 0, 100, '_updated:desc'
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
                const getJobsWithExInfo = jest.fn(async () => [{ ...job, ex: { _status: 'running' } }]);
                context.services.jobsService.getJobsWithExInfo = getJobsWithExInfo;

                const response = await request('GET', '/v2/jobs', { searchParams: { ex: '_status' } });

                expect(response.statusCode).toEqual(200);
                expect(response.body[0].ex).toEqual({ _status: 'running' });
                expect(getJobsWithExInfo).toHaveBeenCalledWith(
                    expect.any(String), 0, 100, '_updated:desc', ['_status']
                );
            });

            it('should add every execution field for an empty ?ex', async () => {
                const getJobsWithExInfo = jest.fn(async () => [{ ...job, ex: execution }]);
                context.services.jobsService.getJobsWithExInfo = getJobsWithExInfo;

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
                ['size', 'ten'],
                ['size', '-1'],
                ['from', '-1'],
                ['active', ''],
            ])('should respond with a 400 for %s=%j', async (key, value) => {
                const response = await request('GET', '/v2/jobs', { searchParams: { [key]: value } });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toContain('Invalid request query');
                expect(response.body.message).toContain(key);
                expect(search).not.toHaveBeenCalled();
            });
        });

        describe('GET /v2/ex', () => {
            let search: jest.Mock<(...args: any[]) => Promise<any[]>>;

            beforeEach(() => {
                search = jest.fn(async () => [execution]);
                context.stores.executionStorage.search = search;
            });

            it('should list executions with the default search options', async () => {
                const response = await request('GET', '/v2/ex');

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual([execution]);
                expect(search).toHaveBeenCalledWith(
                    `ex_id:* AND ${notDeleted}`, 0, 100, '_updated:desc'
                );
            });

            it('should pass an unknown status through, like v1, so it matches nothing', async () => {
                const response = await request('GET', '/v2/ex', { searchParams: { status: 'borked' } });

                expect(response.statusCode).toEqual(200);
                expect(search.mock.calls[0][0]).toContain('_status:"borked"');
            });
        });

        describe('slice errors', () => {
            const errors = [{
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
            let search: jest.Mock<(...args: any[]) => Promise<any[]>>;

            beforeEach(() => {
                search = jest.fn(async () => errors);
                context.stores.stateStorage.search = search;
            });

            it('should have a fixture that matches the response schema', () => {
                expect(TerasliceApiV2.SliceErrorListSchema.safeParse(errors).error).toBeUndefined();
            });

            it('GET /v2/ex/:exId/errors should search the execution with a filter', async () => {
                const response = await request('GET', '/v2/ex/ex-2/errors', {
                    searchParams: { filter: 'slicer_id:1' }
                });

                expect(response.statusCode).toEqual(200);
                expect(search).toHaveBeenCalledWith(
                    '(state:error AND ex_id:"ex-2") AND (slicer_id:1)', 0, 100, '_updated:desc'
                );
            });

            it('should respond with a 400 for an unknown query param', async () => {
                const response = await request('GET', '/v2/ex/ex-2/errors', {
                    searchParams: { state: 'error' }
                });

                expect(response.statusCode).toEqual(400);
                expect(search).not.toHaveBeenCalled();
            });
        });

        describe('GET /v2/jobs/:jobId/tap', () => {
            const tapResult = {
                workerId: 'worker-1',
                sliceId: 'slice-1',
                records: [{ id: 1 }, { id: 2 }],
            };
            let getSliceTap: jest.Mock<(...args: any[]) => Promise<Buffer>>;

            beforeEach(() => {
                context.services.jobsService.getLatestExecutionId = async () => 'ex-1';
                getSliceTap = jest.fn(async () => Buffer.from(JSON.stringify(tapResult)));
                context.services.executionService.getSliceTap = getSliceTap;
            });

            it('should have a fixture that matches the response schema', () => {
                expect(TerasliceApiV2.SliceTapResultSchema.safeParse(tapResult).error)
                    .toBeUndefined();
            });

            it('should send the tap results as JSON with the default size', async () => {
                const response = await request('GET', '/v2/jobs/job-1/tap');

                expect(response.statusCode).toEqual(200);
                expect(response.headers['content-type']).toStartWith('application/json');
                expect(response.body).toEqual(tapResult);
                expect(getSliceTap).toHaveBeenCalledWith('ex-1', { size: 10 });
            });

            it.each(['0', '', 'some', '1.5'])('should respond with a 400 for size=%j', async (size) => {
                const response = await request('GET', '/v2/jobs/job-1/tap', { searchParams: { size } });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toContain('size');
                expect(getSliceTap).not.toHaveBeenCalled();
            });
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
