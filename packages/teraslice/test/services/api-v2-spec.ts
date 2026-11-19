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
import { encodeCursor, queryKey } from '../../src/lib/utils/cursor.js';
import { makeResultWindowError } from '../utils/search-errors.js';

const dirname = nodePath.dirname(fileURLToPath(import.meta.url));

const notDeleted = '(_deleted:false OR (* AND -_deleted:*))';
const resultWindowMessage = 'from + size must be less than or equal to 10000 '
    + '(the index\'s max_result_window), got 10100. Use cursor to page further, or filter to narrow the search.';

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
/** A storage `searchWithTotal()` result */
function withTotal<T>(records: T[], total = records.length) {
    return { records, total };
}

/** A storage `searchWithTotal()` result with the last record's sort values */
function withSort<T>(records: T[], total: number, lastSort: unknown[]) {
    return { records, total, lastSort };
}

/** The JSON inside a cursor, which is opaque to clients */
function readCursor(cursor: string) {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
}

const differentQueryMessage = 'The cursor is for a different query';

/** The `pagination` of a page, with the defaults of a request with no paging params */
function pagination(fields: Record<string, any> = {}) {
    return {
        total: 1, from: 0, size: 100, has_more: false, next_cursor: null, ...fields
    };
}

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
            expect(response.body).toEqual({
                data: [{ ex_id: 'ex-1' }],
                pagination: pagination(),
            });
            expect(getControllerStats).toHaveBeenCalledWith();
        });

        it('should page the controller stats sorted by ex_id', async () => {
            getControllerStats.mockResolvedValue(
                ['ex-c', 'ex-a', 'ex-e', 'ex-b', 'ex-d'].map((ex_id) => ({ ex_id }))
            );

            const first = await request('GET', '/v2/cluster/controllers', {
                searchParams: { size: '2' }
            });
            const last = await request('GET', '/v2/cluster/controllers', {
                searchParams: { from: '4', size: '2' }
            });

            expect(first.body).toEqual({
                data: [{ ex_id: 'ex-a' }, { ex_id: 'ex-b' }],
                pagination: pagination({
                    total: 5, size: 2, has_more: true, next_cursor: expect.any(String)
                }),
            });
            expect(last.body).toEqual({
                data: [{ ex_id: 'ex-e' }],
                pagination: pagination({ total: 5, from: 4, size: 2 }),
            });
        });

        it('should page the controller stats with cursors', async () => {
            getControllerStats.mockResolvedValue(
                ['ex-c', 'ex-a', 'ex-e', 'ex-b', 'ex-d'].map((ex_id) => ({ ex_id }))
            );

            const seen: string[] = [];
            let cursor: string | undefined;
            do {
                const { body } = await request('GET', '/v2/cluster/controllers', {
                    searchParams: { size: '2', ...(cursor && { cursor }) }
                });
                expect(body.pagination.from).toBe(seen.length);
                seen.push(...body.data.map(({ ex_id }: { ex_id: string }) => ex_id));
                cursor = body.pagination.next_cursor ?? undefined;
            } while (cursor);

            expect(seen).toEqual(['ex-a', 'ex-b', 'ex-c', 'ex-d', 'ex-e']);
        });

        it('should start after the cursor\'s controller when it has gone away', async () => {
            getControllerStats.mockResolvedValue(
                ['ex-a', 'ex-b', 'ex-c', 'ex-d'].map((ex_id) => ({ ex_id }))
            );
            const first = await request('GET', '/v2/cluster/controllers', {
                searchParams: { size: '2' }
            });

            getControllerStats.mockResolvedValue(
                ['ex-a', 'ex-c', 'ex-d'].map((ex_id) => ({ ex_id }))
            );
            const second = await request('GET', '/v2/cluster/controllers', {
                searchParams: { size: '2', cursor: first.body.pagination.next_cursor }
            });

            expect(second.body.data).toEqual([{ ex_id: 'ex-c' }, { ex_id: 'ex-d' }]);
        });

        it('should reject a cursor from another list', async () => {
            const cursor = encodeCursor({ after: ['ex-a'], from: 1, key: queryKey('workers') });

            const response = await request('GET', '/v2/cluster/controllers', {
                searchParams: { cursor }
            });

            expect(response.statusCode).toEqual(400);
            expect(response.body.message).toContain(differentQueryMessage);
        });

        it.each([
            ['size', '-1'],
            ['from', '1.5'],
            ['sort', 'ex_id'],
        ])('should respond with a 400 for controllers %s=%j', async (key, value) => {
            const response = await request('GET', '/v2/cluster/controllers', {
                searchParams: { [key]: value }
            });

            expect(response.statusCode).toEqual(400);
            expect(response.body.message).toContain(key);
            expect(getControllerStats).not.toHaveBeenCalled();
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
        const searchWithTotal = jest.fn<(...args: any[]) => Promise<any>>();
        const get = jest.fn<(...args: any[]) => Promise<any>>();
        const submitJob = jest.fn<(...args: any[]) => Promise<any>>();
        const updateJob = jest.fn<(...args: any[]) => Promise<any>>();
        const softDeleteJob = jest.fn<(...args: any[]) => Promise<any>>();
        const startJob = jest.fn<(...args: any[]) => Promise<any>>();
        const setActiveState = jest.fn<(...args: any[]) => Promise<any>>();
        const getLatestExecution = jest.fn<(...args: any[]) => Promise<any>>();
        const getJobWithExInfo = jest.fn<(...args: any[]) => Promise<any>>();
        const getJobsWithExInfoAndTotal = jest.fn<(...args: any[]) => Promise<any>>();

        beforeAll(() => {
            context.stores.jobsStorage.searchWithTotal = searchWithTotal;
            context.stores.jobsStorage.get = get;
            context.services.jobsService.submitJob = submitJob;
            context.services.jobsService.updateJob = updateJob;
            context.services.jobsService.softDeleteJob = softDeleteJob;
            context.services.jobsService.startJob = startJob;
            context.services.jobsService.setActiveState = setActiveState;
            context.services.jobsService.getLatestExecution = getLatestExecution;
            context.services.jobsService.getJobWithExInfo = getJobWithExInfo;
            context.services.jobsService.getJobsWithExInfoAndTotal = getJobsWithExInfoAndTotal;
        });

        beforeEach(() => {
            searchWithTotal.mockReset().mockResolvedValue(withTotal([job]));
            get.mockReset().mockResolvedValue({ job_id: 'job-1' });
            submitJob.mockReset().mockResolvedValue({ job_id: 'job-1' });
            updateJob.mockReset().mockResolvedValue({ job_id: 'job-1' });
            softDeleteJob.mockReset().mockResolvedValue({ job_id: 'job-1', _deleted: true });
            startJob.mockReset().mockResolvedValue({ job_id: 'job-1', ex_id: 'ex-1' });
            setActiveState.mockReset().mockResolvedValue({ job_id: 'job-1' });
            getLatestExecution.mockReset().mockResolvedValue({ ex_id: 'ex-1' });
            getJobWithExInfo.mockReset();
            getJobsWithExInfoAndTotal.mockReset();
        });

        describe('GET /v2/jobs', () => {
            it('should search jobs with the default options', async () => {
                const response = await request('GET', '/v2/jobs');

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({ data: [job], pagination: pagination() });
                expect(searchWithTotal).toHaveBeenCalledWith({
                    query: `job_id:* AND ${notDeleted}`, from: 0, size: 100, sort: '_updated:desc'
                });
            });

            it('should filter active jobs for active=true', async () => {
                const response = await request('GET', '/v2/jobs', {
                    searchParams: { active: 'true' }
                });

                expect(response.statusCode).toEqual(200);
                expect(searchWithTotal).toHaveBeenCalledWith({
                    query: `job_id:* AND !active:false AND ${notDeleted}`,
                    from: 0,
                    size: 100,
                    sort: '_updated:desc',
                });
            });

            it('should pass paging, sort, active, deleted and filter through', async () => {
                const response = await request('GET', '/v2/jobs', {
                    searchParams: {
                        size: '5', from: '10', sort: 'name:asc', active: 'false', deleted: 'true',
                        filter: 'name:foo',
                    }
                });

                expect(response.statusCode).toEqual(200);
                expect(searchWithTotal).toHaveBeenCalledWith({
                    query: '(job_id:* AND active:false AND _deleted:true) AND (name:foo)',
                    from: 10,
                    size: 5,
                    sort: 'name:asc',
                });
            });

            it('should add the latest execution with only the fields in ?ex', async () => {
                getJobsWithExInfoAndTotal.mockResolvedValue(
                    withTotal([{ ...job, ex: { _status: 'running' } }])
                );

                const response = await request('GET', '/v2/jobs', { searchParams: { ex: '_status' } });

                expect(response.statusCode).toEqual(200);
                expect(response.body.data[0].ex).toEqual({ _status: 'running' });
                expect(getJobsWithExInfoAndTotal).toHaveBeenCalledWith({
                    query: expect.any(String),
                    from: 0,
                    size: 100,
                    sort: '_updated:desc',
                    exFields: ['_status'],
                });
            });

            it('should add every execution field for an empty ?ex', async () => {
                getJobsWithExInfoAndTotal.mockResolvedValue(withTotal([{ ...job, ex: execution }]));

                await request('GET', '/v2/jobs', { searchParams: { ex: '' } });

                expect(getJobsWithExInfoAndTotal).toHaveBeenCalledWith({
                    query: expect.any(String),
                    from: 0,
                    size: 100,
                    sort: '_updated:desc',
                    exFields: undefined,
                });
            });

            it('should leave large pages to the search cluster\'s max_result_window', async () => {
                const response = await request('GET', '/v2/jobs', { searchParams: { size: '50000' } });

                expect(response.statusCode).toEqual(200);
                expect(searchWithTotal.mock.calls[0][0].size).toBe(50000);
            });

            it('should explain a page past max_result_window', async () => {
                searchWithTotal.mockRejectedValue(makeResultWindowError(10000, 10100));

                const response = await request('GET', '/v2/jobs', { searchParams: { from: '10000' } });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toBe(resultWindowMessage);
            });

            it('should explain a page past max_result_window with ?ex', async () => {
                getJobsWithExInfoAndTotal.mockRejectedValue(makeResultWindowError(10000, 10100));

                const response = await request('GET', '/v2/jobs', {
                    searchParams: { from: '10000', ex: '_status' }
                });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toBe(resultWindowMessage);
            });

            it('should report the total and whether there are more pages', async () => {
                searchWithTotal.mockResolvedValue(withTotal([job, job], 5));

                const first = await request('GET', '/v2/jobs', { searchParams: { size: '2' } });
                const last = await request('GET', '/v2/jobs', {
                    searchParams: { from: '3', size: '2' }
                });

                expect(first.body.pagination).toEqual(
                    pagination({ total: 5, size: 2, has_more: true })
                );
                expect(last.body.pagination).toEqual(
                    pagination({ total: 5, from: 3, size: 2, has_more: false })
                );
            });

            it('should report the total with ?ex', async () => {
                getJobsWithExInfoAndTotal.mockResolvedValue(withTotal([{ ...job, ex: {} }], 7));

                const response = await request('GET', '/v2/jobs', {
                    searchParams: { ex: '_status', size: '1' }
                });

                expect(response.body.pagination).toEqual(
                    pagination({ total: 7, size: 1, has_more: true })
                );
            });

            it('should return just the total for size=0', async () => {
                searchWithTotal.mockResolvedValue(withTotal([], 12));

                const response = await request('GET', '/v2/jobs', { searchParams: { size: '0' } });

                expect(response.statusCode).toEqual(200);
                expect(response.body).toEqual({
                    data: [],
                    pagination: pagination({ total: 12, size: 0, has_more: true }),
                });
                expect(searchWithTotal.mock.calls[0][0].size).toBe(0);
            });

            describe('cursor', () => {
                /** The first page of 2 of 5 jobs, sorted by `sort` */
                async function firstPage(searchParams: Record<string, string> = {}) {
                    searchWithTotal.mockResolvedValueOnce(
                        withSort([job, job], 5, [1700000000000, 'job-2'])
                    );
                    const response = await request('GET', '/v2/jobs', {
                        searchParams: { size: '2', ...searchParams }
                    });
                    return response.body.pagination.next_cursor as string;
                }

                it('should return a cursor after the last job, counting the jobs', async () => {
                    const cursor = await firstPage();

                    expect(readCursor(cursor)).toEqual({
                        v: 1, after: [1700000000000, 'job-2'], from: 2, key: expect.any(String)
                    });
                });

                it('should search after the cursor from 0, reporting its from', async () => {
                    const cursor = await firstPage({ sort: 'name:asc', filter: 'name:foo' });
                    searchWithTotal.mockResolvedValue(withSort([job, job], 5, [1, 'job-4']));

                    const response = await request('GET', '/v2/jobs', {
                        searchParams: {
                            size: '2', sort: 'name:asc', filter: 'name:foo', cursor
                        }
                    });

                    expect(response.statusCode).toEqual(200);
                    expect(searchWithTotal).toHaveBeenLastCalledWith({
                        query: `(job_id:* AND ${notDeleted}) AND (name:foo)`,
                        from: 0,
                        searchAfter: [1700000000000, 'job-2'],
                        size: 2,
                        sort: 'name:asc',
                    });
                    expect(response.body.pagination).toEqual(pagination({
                        total: 5, from: 2, size: 2, has_more: true, next_cursor: expect.any(String)
                    }));
                    expect(readCursor(response.body.pagination.next_cursor))
                        .toMatchObject({ after: [1, 'job-4'], from: 4 });
                });

                it('should keep a long sentinel exact', async () => {
                    searchWithTotal.mockResolvedValueOnce(
                        withSort([job], 5, [9223372036854775807n, 'job-1'])
                    );
                    const first = await request('GET', '/v2/jobs', {
                        searchParams: { size: '1', sort: '_deleted_on:asc' }
                    });

                    await request('GET', '/v2/jobs', {
                        searchParams: {
                            size: '1', sort: '_deleted_on:asc', cursor: first.body.pagination.next_cursor
                        }
                    });

                    expect(searchWithTotal.mock.calls[1][0].searchAfter)
                        .toEqual([9223372036854775807n, 'job-1']);
                });

                it('should pass the cursor through with ?ex', async () => {
                    const cursor = await firstPage();
                    getJobsWithExInfoAndTotal.mockResolvedValue(withTotal([{ ...job, ex: {} }], 5));

                    const response = await request('GET', '/v2/jobs', {
                        searchParams: { size: '3', ex: '_status', cursor }
                    });

                    expect(response.statusCode).toEqual(200);
                    expect(getJobsWithExInfoAndTotal).toHaveBeenCalledWith(expect.objectContaining({
                        from: 0, searchAfter: [1700000000000, 'job-2'], size: 3
                    }));
                });

                it('should work with the default sort sent as an empty ?sort', async () => {
                    const cursor = await firstPage();

                    const response = await request('GET', '/v2/jobs', {
                        searchParams: { sort: '', cursor }
                    });

                    expect(response.statusCode).toEqual(200);
                });

                it.each([
                    ['sort', 'name:desc'],
                    ['filter', 'name:bar'],
                    ['active', 'true'],
                    ['deleted', 'true'],
                ])('should reject the cursor with another %s', async (key, value) => {
                    const cursor = await firstPage();

                    const response = await request('GET', '/v2/jobs', {
                        searchParams: { [key]: value, cursor }
                    });

                    expect(response.statusCode).toEqual(400);
                    expect(response.body.message).toContain(differentQueryMessage);
                    expect(response.body.message).toContain('cursor');
                    expect(searchWithTotal).toHaveBeenCalledTimes(1);
                });

                it('should reject a cursor that isn\'t one', async () => {
                    const response = await request('GET', '/v2/jobs', {
                        searchParams: { cursor: 'abc' }
                    });

                    expect(response.statusCode).toEqual(400);
                    expect(response.body.message).toContain('Invalid cursor');
                    expect(searchWithTotal).not.toHaveBeenCalled();
                });

                it('should have no cursor on the last page', async () => {
                    searchWithTotal.mockResolvedValue(withSort([job], 5, [1, 'job-5']));

                    const response = await request('GET', '/v2/jobs', {
                        searchParams: { from: '4', size: '2' }
                    });

                    expect(response.body.pagination).toMatchObject({
                        has_more: false, next_cursor: null
                    });
                });

                it('should have no cursor for size=0', async () => {
                    searchWithTotal.mockResolvedValue(withTotal([], 12));

                    const response = await request('GET', '/v2/jobs', { searchParams: { size: '0' } });

                    expect(response.body.pagination).toMatchObject({
                        has_more: true, next_cursor: null
                    });
                });
            });

            it('should use the default sort for an empty ?sort, like v1', async () => {
                await request('GET', '/v2/jobs', { searchParams: { sort: '' } });

                expect(searchWithTotal.mock.calls[0][0].sort).toBe('_updated:desc');
            });

            it.each([
                'name',
                'name:desc',
                '_created:asc,name',
            ])('should accept sort=%j', async (sort) => {
                const response = await request('GET', '/v2/jobs', { searchParams: { sort } });

                expect(response.statusCode).toEqual(200);
                expect(searchWithTotal.mock.calls[0][0].sort).toBe(sort);
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
                expect(searchWithTotal).not.toHaveBeenCalled();
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
        const searchWithTotal = jest.fn<(...args: any[]) => Promise<any>>();

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
            context.stores.stateStorage.searchWithTotal = searchWithTotal;
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
            searchWithTotal.mockReset().mockResolvedValue(withTotal(sliceErrors));
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
            expect(response.body).toEqual({ data: sliceErrors, pagination: pagination() });
            expect(searchWithTotal).toHaveBeenCalledWith({
                query: `state:error AND ex_id:"${exId}"`, from: 0, size: 100, sort: '_updated:desc'
            });
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
        const searchWithTotal = jest.fn<(...args: any[]) => Promise<any>>();
        const stateSearchWithTotal = jest.fn<(...args: any[]) => Promise<any>>();
        const getExecutionContext = jest.fn<(...args: any[]) => Promise<any>>();
        const getLatestExecutionId = jest.fn<(...args: any[]) => Promise<any>>();

        beforeAll(() => {
            context.stores.executionStorage.searchWithTotal = searchWithTotal;
            context.stores.stateStorage.searchWithTotal = stateSearchWithTotal;
            context.services.executionService.getExecutionContext = getExecutionContext;
            context.services.jobsService.getLatestExecutionId = getLatestExecutionId;
        });

        beforeEach(() => {
            searchWithTotal.mockReset().mockResolvedValue(withTotal([execution]));
            stateSearchWithTotal.mockReset().mockResolvedValue(withTotal(sliceErrors));
            getExecutionContext.mockReset().mockResolvedValue(execution);
            getLatestExecutionId.mockReset();
        });

        it('should list executions with the default search options', async () => {
            const response = await request('GET', '/v2/ex');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ data: [execution], pagination: pagination() });
            expect(searchWithTotal).toHaveBeenCalledWith({
                query: `ex_id:* AND ${notDeleted}`, from: 0, size: 100, sort: '_updated:desc'
            });
        });

        it('should filter by job_id and status', async () => {
            const response = await request('GET', '/v2/ex', {
                searchParams: { job_id: 'job-1', status: 'running,failing' }
            });

            expect(response.statusCode).toEqual(200);
            expect(searchWithTotal).toHaveBeenCalledWith({
                query: `ex_id:* AND job_id:"job-1" AND (_status:"running" OR _status:"failing") AND ${notDeleted}`,
                from: 0,
                size: 100,
                sort: '_updated:desc',
            });
        });

        it('should pass an unknown status through, like v1, so it matches nothing', async () => {
            const response = await request('GET', '/v2/ex', { searchParams: { status: 'borked' } });

            expect(response.statusCode).toEqual(200);
            expect(searchWithTotal.mock.calls[0][0].query).toContain('_status:"borked"');
        });

        it('should report the total and whether there are more pages', async () => {
            searchWithTotal.mockResolvedValue(withTotal([execution], 3));

            const response = await request('GET', '/v2/ex', {
                searchParams: { from: '1', size: '1' }
            });

            expect(response.body.pagination).toEqual(
                pagination({ total: 3, from: 1, size: 1, has_more: true })
            );
        });

        it('should page with cursors', async () => {
            searchWithTotal.mockResolvedValueOnce(withSort([execution], 3, [1, 'ex-1']));
            const first = await request('GET', '/v2/ex', {
                searchParams: { size: '1', job_id: 'job-1', status: 'running' }
            });

            const second = await request('GET', '/v2/ex', {
                searchParams: {
                    size: '1', job_id: 'job-1', status: 'running', cursor: first.body.pagination.next_cursor
                }
            });

            expect(second.statusCode).toEqual(200);
            expect(second.body.pagination).toMatchObject({ from: 1 });
            expect(searchWithTotal).toHaveBeenLastCalledWith(expect.objectContaining({
                from: 0, searchAfter: [1, 'ex-1'], size: 1
            }));
        });

        it.each([
            ['job_id', 'job-2'],
            ['status', 'failed'],
        ])('should reject the cursor with another %s', async (key, value) => {
            searchWithTotal.mockResolvedValueOnce(withSort([execution], 3, [1, 'ex-1']));
            const first = await request('GET', '/v2/ex', { searchParams: { size: '1' } });

            const response = await request('GET', '/v2/ex', {
                searchParams: { [key]: value, cursor: first.body.pagination.next_cursor }
            });

            expect(response.statusCode).toEqual(400);
            expect(response.body.message).toContain(differentQueryMessage);
        });

        it('should explain a page past max_result_window', async () => {
            searchWithTotal.mockRejectedValue(makeResultWindowError(10000, 10100));

            const response = await request('GET', '/v2/ex', { searchParams: { from: '10000' } });

            expect(response.statusCode).toEqual(400);
            expect(response.body.message).toBe(resultWindowMessage);
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
                expect(response.body).toEqual({
                    data: sliceErrors,
                    pagination: pagination({ size: 10 }),
                });
                expect(stateSearchWithTotal).toHaveBeenCalledWith({
                    query: '(state:error AND ex_id:"ex-2") AND (slicer_id:1)',
                    from: 0,
                    size: 10,
                    sort: '_updated:desc',
                });
                expect(getLatestExecutionId).not.toHaveBeenCalled();
            });

            it('should pass a total past 10,000 through', async () => {
                stateSearchWithTotal.mockResolvedValue(withTotal(sliceErrors, 12000));

                const response = await request('GET', '/v2/ex/ex-2/errors', {
                    searchParams: { size: '1' }
                });

                expect(response.body.pagination).toEqual(pagination({
                    total: 12000, size: 1, has_more: true
                }));
            });

            it('should page with cursors for the same execution only', async () => {
                stateSearchWithTotal.mockResolvedValueOnce(
                    withSort(sliceErrors, 3, [1700000000000, 'slice-1'])
                );
                const first = await request('GET', '/v2/ex/ex-2/errors', {
                    searchParams: { size: '1' }
                });
                const cursor = first.body.pagination.next_cursor;

                const second = await request('GET', '/v2/ex/ex-2/errors', {
                    searchParams: { size: '1', cursor }
                });
                const otherEx = await request('GET', '/v2/ex/ex-3/errors', {
                    searchParams: { size: '1', cursor }
                });

                expect(second.statusCode).toEqual(200);
                expect(stateSearchWithTotal).toHaveBeenLastCalledWith({
                    query: 'state:error AND ex_id:"ex-2"',
                    from: 0,
                    searchAfter: [1700000000000, 'slice-1'],
                    size: 1,
                    sort: '_updated:desc',
                });
                expect(otherEx.statusCode).toEqual(400);
                expect(otherEx.body.message).toContain(differentQueryMessage);
            });

            it('should respond with a 400 for an unknown query param', async () => {
                const response = await request('GET', '/v2/ex/ex-2/errors', {
                    searchParams: { state: 'error' }
                });

                expect(response.statusCode).toEqual(400);
                expect(stateSearchWithTotal).not.toHaveBeenCalled();
            });

            it('should explain a page past max_result_window', async () => {
                stateSearchWithTotal.mockRejectedValue(makeResultWindowError(10000, 10100));

                const response = await request('GET', '/v2/ex/ex-2/errors', {
                    searchParams: { from: '10000' }
                });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toBe(resultWindowMessage);
            });
        });
    });

    describe('GET /v2/txt/*', () => {
        const jobsSearchWithTotal = jest.fn<(...args: any[]) => Promise<any>>();
        const getJobsWithExInfoAndTotal = jest.fn<(...args: any[]) => Promise<any>>();
        const exSearchWithTotal = jest.fn<(...args: any[]) => Promise<any>>();
        const findAllWorkers = jest.fn<(...args: any[]) => any>();
        const getClusterState = jest.fn<(...args: any[]) => any>();
        const getControllerStats = jest.fn<(...args: any[]) => Promise<any>>();

        const worker = { job_id: 'job-1', node_id: 'node-1', hostname: 'host-1' };
        const workers = [
            {
                ...worker, assignment: 'worker', worker_id: 10, ex_id: 'ex-b', pid: 110
            },
            {
                ...worker, assignment: 'execution_controller', worker_id: 1, ex_id: 'ex-b', pid: 101
            },
            {
                ...worker, assignment: 'worker', worker_id: 2, ex_id: 'ex-a', pid: 102
            },
            {
                ...worker, assignment: 'worker', worker_id: 1, ex_id: 'ex-a', pid: 103
            },
        ];
        const node = {
            hostname: 'host',
            pid: 1,
            node_version: 'v24',
            teraslice_version: 'v3.0.0',
            total: 10,
            state: 'connected',
            available: 9,
        };
        const controller = {
            job_id: 'job-1',
            workers_available: 1,
            workers_active: 2,
            failed: 0,
            queued: 3,
            processed: 4,
        };

        beforeAll(() => {
            context.stores.jobsStorage.searchWithTotal = jobsSearchWithTotal;
            context.services.jobsService.getJobsWithExInfoAndTotal = getJobsWithExInfoAndTotal;
            context.stores.executionStorage.searchWithTotal = exSearchWithTotal;
            context.services.executionService.findAllWorkers = findAllWorkers;
            context.services.clusterService.getClusterState = getClusterState;
            context.services.executionService.getControllerStats = getControllerStats;
        });

        beforeEach(() => {
            jobsSearchWithTotal.mockReset().mockResolvedValue(withTotal([job]));
            getJobsWithExInfoAndTotal.mockReset()
                .mockResolvedValue(withTotal([{ ...job, ex: { _status: 'running' } }]));
            exSearchWithTotal.mockReset().mockResolvedValue(withTotal([execution]));
            findAllWorkers.mockReset().mockReturnValue(workers);
            getClusterState.mockReset().mockReturnValue({
                'node-b': { ...node, node_id: 'node-b', active: [{}, {}] },
                'node-a': { ...node, node_id: 'node-a', active: [{}] },
            });
            getControllerStats.mockReset().mockResolvedValue([
                { ...controller, ex_id: 'ex-b', name: 'job-b' },
                { ...controller, ex_id: 'ex-a', name: 'job-a' },
            ]);
        });

        function requestText(path: string, searchParams: Record<string, string> = {}) {
            return request('GET', `/v2${path}`, { searchParams, responseType: 'text' });
        }

        /**
         * A table response as rows of cells (the column names, the line
         * under them, then a row per record), and the footer lines
         */
        function parseTable(text: string) {
            const lines = text.trimEnd().split('\n');
            const blank = lines.indexOf('');
            const table = blank === -1 ? lines : lines.slice(0, blank);
            return {
                rows: table.map((line) => line.trim().split(/\s+/)),
                footer: blank === -1 ? [] : lines.slice(blank + 1),
            };
        }

        /** The first cell of each record's row */
        function firstColumn(text: string) {
            return parseTable(text).rows.slice(2).map(([cell]) => cell);
        }

        describe('GET /v2/txt/jobs', () => {
            it('should print v1\'s default columns, the footer and the paging headers', async () => {
                jobsSearchWithTotal.mockResolvedValue(withSort([job], 3, [1, 'job-1']));

                const response = await requestText('/txt/jobs', { size: '1' });
                const { rows, footer } = parseTable(response.body);

                expect(response.statusCode).toEqual(200);
                expect(response.headers['content-type']).toStartWith('text/plain');
                expect(rows[0]).toEqual(['job_id', 'name', 'active', 'lifecycle', 'slicers', 'workers', '_created', '_updated']);
                expect(rows[2]).toEqual(['job-1', 'test-job', 'true', 'persistent', '1', '2', job._created, job._updated]);
                const cursor = response.headers['x-next-cursor'];
                expect(footer).toEqual(['Showing 1-1 of 3', `next: ?size=1&cursor=${cursor}`]);
                expect(response.headers).toMatchObject({
                    'x-total-count': '3',
                    'x-from': '0',
                    'x-size': '1',
                });
                expect(readCursor(cursor)).toMatchObject({ after: [1, 'job-1'], from: 1 });
                expect(response.headers).not.toHaveProperty('x-total-relation');
            });

            it('should leave out the next cursor on the last page', async () => {
                const response = await requestText('/txt/jobs');

                expect(parseTable(response.body).footer).toEqual(['Showing 1-1 of 1']);
                expect(response.headers).not.toHaveProperty('x-next-cursor');
            });

            it('should share cursors with GET /v2/jobs', async () => {
                jobsSearchWithTotal.mockResolvedValueOnce(withSort([job], 3, [1, 'job-1']));
                const json = await request('GET', '/v2/jobs', {
                    searchParams: { size: '1', active: 'true' }
                });

                const response = await requestText('/txt/jobs', {
                    size: '1', active: 'true', cursor: json.body.pagination.next_cursor
                });

                expect(response.statusCode).toEqual(200);
                expect(response.body).toContain('Showing 2-2 of 1');
                expect(jobsSearchWithTotal.mock.calls[1][0].searchAfter).toEqual([1, 'job-1']);
            });

            it('should search like GET /v2/jobs', async () => {
                await requestText('/txt/jobs', {
                    active: 'true', from: '5', size: '5', sort: 'name:asc', filter: 'name:"a"'
                });

                expect(jobsSearchWithTotal).toHaveBeenCalledWith({
                    query: `(job_id:* AND !active:false AND ${notDeleted}) AND (name:"a")`,
                    from: 5,
                    size: 5,
                    sort: 'name:asc',
                });
            });

            it('should add _deleted_on with deleted=true', async () => {
                const response = await requestText('/txt/jobs', { deleted: 'true' });

                expect(parseTable(response.body).rows[0].at(-1)).toBe('_deleted_on');
            });

            it('should print only the rows of the fields asked for with headers=false', async () => {
                jobsSearchWithTotal.mockResolvedValue(withTotal([job], 3));

                const response = await requestText('/txt/jobs', { fields: 'name,job_id', headers: 'false' });

                expect(parseTable(response.body)).toEqual({ rows: [['test-job', 'job-1']], footer: [] });
                expect(response.headers['x-total-count']).toBe('3');
            });

            it('should print execution fields with ?ex', async () => {
                const response = await requestText('/txt/jobs', { ex: '_status', fields: 'job_id,ex._status' });

                expect(parseTable(response.body).rows[2]).toEqual(['job-1', 'running']);
                expect(getJobsWithExInfoAndTotal.mock.calls[0][0].exFields).toEqual(['_status']);
            });

            it('should reject an unknown param', async () => {
                const response = await requestText('/txt/jobs', { bogus: '1' });

                expect(response.statusCode).toEqual(400);
            });
        });

        describe('GET /v2/txt/ex', () => {
            it('should print v1\'s default columns', async () => {
                const response = await requestText('/txt/ex');
                const { rows, footer } = parseTable(response.body);

                expect(rows[0]).toEqual(['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated']);
                expect(rows[2]).toEqual(['test-job', 'persistent', '1', '2', 'running', 'ex-1', 'job-1', execution._created, execution._updated]);
                expect(footer).toEqual(['Showing 1-1 of 1']);
            });

            it('should search like GET /v2/ex, adding _deleted_on with deleted=true', async () => {
                const response = await requestText('/txt/ex', { job_id: 'job-1', deleted: 'true' });

                expect(parseTable(response.body).rows[0].at(-1)).toBe('_deleted_on');
                expect(exSearchWithTotal.mock.calls[0][0].query).toBe('ex_id:* AND job_id:"job-1" AND _deleted:true');
            });
        });

        describe('GET /v2/txt/workers', () => {
            afterEach(() => {
                context.sysconfig.teraslice.cluster_manager_type = 'native';
            });

            it('should sort by ex_id, assignment, then worker_id, as numbers', async () => {
                const response = await requestText('/txt/workers', { fields: 'ex_id,assignment,worker_id' });

                expect(parseTable(response.body).rows.slice(2)).toEqual([
                    ['ex-a', 'worker', '1'],
                    ['ex-a', 'worker', '2'],
                    ['ex-b', 'execution_controller', '1'],
                    ['ex-b', 'worker', '10'],
                ]);
            });

            it('should page the sorted workers', async () => {
                const response = await requestText('/txt/workers', { from: '1', size: '2', fields: 'pid' });

                const cursor = response.headers['x-next-cursor'];
                expect(firstColumn(response.body)).toEqual(['102', '101']);
                expect(parseTable(response.body).footer).toEqual(['Showing 2-3 of 4', `next: ?size=2&cursor=${cursor}`]);
                expect(readCursor(cursor)).toMatchObject({
                    after: ['ex-b', 'execution_controller', 1], from: 3
                });

                const next = await requestText('/txt/workers', { cursor, size: '2', fields: 'pid' });

                expect(firstColumn(next.body)).toEqual(['110']);
                expect(parseTable(next.body).footer).toEqual(['Showing 4-4 of 4']);
                expect(next.headers).not.toHaveProperty('x-next-cursor');
            });

            it.each([
                ['native', ['assignment', 'job_id', 'ex_id', 'node_id', 'pid']],
                ['kubernetesV2', ['assignment', 'job_id', 'ex_id', 'node_id', 'pod_name', 'image']],
            ])('should print v1\'s default columns on %s', async (clusterType, columns) => {
                context.sysconfig.teraslice.cluster_manager_type = clusterType;

                const response = await requestText('/txt/workers');

                expect(parseTable(response.body).rows[0]).toEqual(columns);
            });
        });

        describe('GET /v2/txt/nodes', () => {
            it('should sort by node_id and print active as a count', async () => {
                const response = await requestText('/txt/nodes');
                const { rows } = parseTable(response.body);

                expect(rows[0]).toEqual(['node_id', 'state', 'hostname', 'total', 'active', 'pid', 'teraslice_version', 'node_version']);
                expect(rows.slice(2)).toEqual([
                    ['node-a', 'connected', 'host', '10', '1', '1', 'v3.0.0', 'v24'],
                    ['node-b', 'connected', 'host', '10', '2', '1', 'v3.0.0', 'v24'],
                ]);
            });

            it('should page the sorted nodes', async () => {
                const response = await requestText('/txt/nodes', { from: '1' });

                expect(firstColumn(response.body)).toEqual(['node-b']);
                expect(response.headers['x-total-count']).toBe('2');
            });

            it('should page the sorted nodes with cursors', async () => {
                const first = await requestText('/txt/nodes', { size: '1' });
                const next = await requestText('/txt/nodes', {
                    size: '1', cursor: first.headers['x-next-cursor']
                });

                expect(firstColumn(first.body)).toEqual(['node-a']);
                expect(firstColumn(next.body)).toEqual(['node-b']);

                // a full page after a cursor may have more after it, so the
                // last node gets a cursor to an empty page
                const last = await requestText('/txt/nodes', {
                    size: '1', cursor: next.headers['x-next-cursor']
                });
                expect(last.body).toContain('Showing 0 of 2');
                expect(last.headers).not.toHaveProperty('x-next-cursor');
            });
        });

        describe('GET /v2/txt/controllers', () => {
            it('should print v1\'s default columns, sorted by ex_id', async () => {
                const response = await requestText('/txt/controllers');
                const { rows } = parseTable(response.body);

                expect(rows[0]).toEqual(['name', 'job_id', 'workers_available', 'workers_active', 'failed', 'queued', 'processed']);
                expect(rows.slice(2)).toEqual([
                    ['job-a', 'job-1', '1', '2', '0', '3', '4'],
                    ['job-b', 'job-1', '1', '2', '0', '3', '4'],
                ]);
            });

            it('should page the sorted controllers', async () => {
                const response = await requestText('/txt/controllers', { size: '1' });

                const cursor = response.headers['x-next-cursor'];
                expect(firstColumn(response.body)).toEqual(['job-a']);
                expect(parseTable(response.body).footer).toEqual(['Showing 1-1 of 2', `next: ?size=1&cursor=${cursor}`]);
            });

            it('should share cursors with GET /v2/cluster/controllers', async () => {
                const json = await request('GET', '/v2/cluster/controllers', {
                    searchParams: { size: '1' }
                });

                const response = await requestText('/txt/controllers', {
                    size: '1', cursor: json.body.pagination.next_cursor
                });

                expect(firstColumn(response.body)).toEqual(['job-b']);
            });
        });

        it('should print an empty page as the column names and the footer', async () => {
            getControllerStats.mockResolvedValue([]);

            const response = await requestText('/txt/controllers');
            const { rows, footer } = parseTable(response.body);

            expect(rows[0]).toEqual(['name', 'job_id', 'workers_available', 'workers_active', 'failed', 'queued', 'processed']);
            expect(footer).toEqual(['Showing 0 of 0']);
        });

        describe('fields', () => {
            it.each([
                ['/txt/jobs', 'job_id,name,active,lifecycle,slicers,workers,_created,_updated,_deleted_on'],
                ['/txt/ex', 'name,lifecycle,slicers,workers,_status,ex_id,job_id,_created,_updated,_deleted_on'],
                ['/txt/workers', 'assignment,job_id,ex_id,node_id,hostname,pid,pod_name,image,worker_id'],
                ['/txt/nodes', 'node_id,state,hostname,total,active,pid,teraslice_version,node_version'],
                ['/txt/controllers', 'name,job_id,workers_available,workers_active,failed,queued,processed'],
            ])('%s should accept its default columns', async (path, fields) => {
                const response = await requestText(path, { fields });

                expect(response.statusCode).toEqual(200);
            });

            it.each([
                '/txt/jobs', '/txt/ex', '/txt/workers', '/txt/nodes', '/txt/controllers',
            ])('%s should reject an unknown field', async (path) => {
                const response = await request('GET', `/v2${path}`, { searchParams: { fields: 'foo,bar' } });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toInclude('Unknown fields "foo", "bar". Expected fields of');
            });

            it.each([
                'ex._status',
                'operations.0._op',
                'env_vars.FOO',
            ])('should accept the nested path %s', async (fields) => {
                const response = await requestText('/txt/jobs', { fields });

                expect(response.statusCode).toEqual(200);
            });

            it.each([
                'ex.foo',
                'name.length',
                'toString',
                'ex.toString',
            ])('should reject the path %s', async (fields) => {
                const response = await request('GET', '/v2/txt/jobs', { searchParams: { fields } });

                expect(response.statusCode).toEqual(400);
                expect(response.body.message).toInclude(`Unknown field "${fields}"`);
            });

            it('should reject a nested path on nodes\' active count', async () => {
                const response = await requestText('/txt/nodes', { fields: 'active.0' });

                expect(response.statusCode).toEqual(400);
            });
        });
    });

    describe('cursor query param', () => {
        it.each([
            '/v2/jobs',
            '/v2/ex',
            '/v2/jobs/job-1/errors',
            '/v2/ex/ex-1/errors',
            '/v2/cluster/controllers',
            '/v2/txt/jobs',
            '/v2/txt/ex',
            '/v2/txt/workers',
            '/v2/txt/nodes',
            '/v2/txt/controllers',
        ])('should reject cursor with from on %s', async (path) => {
            const response = await request('GET', path, {
                searchParams: { cursor: 'abc', from: '100' },
                responseType: 'text',
            });

            expect(response.statusCode).toEqual(400);
            expect(response.body).toContain('Send cursor or from, not both');
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
            ['GET', '/txt/slicers'],
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
            expect(TerasliceApiV2.SliceErrorPageSchema.safeParse(
                { data: sliceErrors, pagination: pagination() }
            ).error).toBeUndefined();
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

    describe('GET /v2/openapi.json', () => {
        let statusCode: number;
        let spec: any;

        beforeAll(async () => {
            ({ statusCode, body: spec } = await request('GET', '/v2/openapi.json'));
        });

        function operations(): [string, string, any][] {
            return Object.entries(spec.paths).flatMap(([path, item]: [string, any]) => (
                Object.entries(item).map(
                    ([method, op]) => [path, method, op] as [string, string, any]
                )
            ));
        }

        it('should be an OpenAPI 3.1 document for this version', () => {
            expect(statusCode).toEqual(200);
            expect(spec.openapi).toEqual('3.1.0');
            expect(spec.info.version).toEqual(version);
        });

        it('should include every registered route', () => {
            const { routes } = createV2Registry(api);
            const operationIds = operations().map(([, , op]) => op.operationId);

            for (const route of routes) {
                expect(operationIds).toContain(route.operationId);
            }
        });

        it('should include the job submit and update routes', () => {
            const jobConfigRef = { $ref: '#/components/schemas/JobConfig' };

            expect(spec.paths['/v2/jobs'].post.requestBody.content['application/json'].schema)
                .toEqual(jobConfigRef);
            expect(spec.paths['/v2/jobs/{jobId}'].put.requestBody.content['application/json'].schema)
                .toEqual(jobConfigRef);
            expect(spec.components.schemas.JobConfig.properties.operations.items)
                .toEqual({ $ref: '#/components/schemas/JobOperation' });
        });

        it('should describe the txt routes as text/plain with the paging headers', () => {
            const ok = spec.paths['/v2/txt/jobs'].get.responses[200];

            expect(ok.content['text/plain'].schema)
                .toEqual({ $ref: '#/components/schemas/TxtTable' });
            expect(Object.keys(ok.headers))
                .toEqual(['X-Total-Count', 'X-From', 'X-Size', 'X-Next-Cursor']);
            expect(spec.paths['/v2/txt/jobs'].get.tags).toEqual(['Text']);
        });

        it.each([
            ['/v2/jobs'],
            ['/v2/ex'],
            ['/v2/jobs/{jobId}/errors'],
            ['/v2/ex/{exId}/errors'],
            ['/v2/cluster/controllers'],
            ['/v2/txt/jobs'],
            ['/v2/txt/ex'],
            ['/v2/txt/workers'],
            ['/v2/txt/nodes'],
            ['/v2/txt/controllers'],
        ])('should list the cursor query param on %s', (path) => {
            const names = spec.paths[path].get.parameters.map((param: any) => param.name);

            expect(names).toContain('cursor');
            expect(names).toContain('from');
        });

        it('should have unique operationIds', () => {
            const operationIds = operations().map(([, , op]) => op.operationId);
            expect(new Set(operationIds).size).toEqual(operationIds.length);
        });

        it('should list every path param', () => {
            for (const [path, method, op] of operations()) {
                const names = Array.from(path.matchAll(/\{(\w+)\}/g), (match) => match[1]);
                const pathParams = (op.parameters ?? [])
                    .filter((param: any) => param.in === 'path')
                    .map((param: any) => param.name);

                expect({ route: `${method} ${path}`, params: pathParams.toSorted() })
                    .toEqual({ route: `${method} ${path}`, params: names.toSorted() });
            }
        });

        it('should only have refs that resolve to a component', () => {
            const refs = Array.from(
                JSON.stringify(spec).matchAll(/"\$ref":"([^"]+)"/g), (match) => match[1]
            );
            expect(refs).not.toBeEmpty();

            const broken = refs.filter((ref) => {
                const [, section, name] = ref.match(/^#\/components\/(schemas|responses)\/(.+)$/) ?? [];
                return !section || !spec.components[section][name];
            });
            expect(broken).toEqual([]);
        });
    });

    describe('GET /v2/api-docs', () => {
        it('should return the docs page', async () => {
            const response = await request('GET', '/v2/api-docs', { responseType: 'text' });

            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toStartWith('text/html');
            expect(response.body).toContain('spec-url="/v2/openapi.json"');
        });

        it('should serve the RapiDoc script', async () => {
            const response = await request('GET', '/v2/api-docs/rapidoc-min.js', { responseType: 'text' });

            expect(response.statusCode).toEqual(200);
            expect(response.headers['content-type']).toContain('javascript');
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
