import 'jest-extended';
import { jest } from '@jest/globals';
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

    describe('GET /jobs/:jobId/trace and /ex/:exId/trace', () => {
        const exId = 'some-ex-id';
        const traceResults = {
            workerId: 'some-worker',
            sliceId: 'some-slice',
            records: [[{ record: { id: 1 }, metadata: { _key: '1' } }]]
        };

        const getSliceTrace = jest.fn<(...args: any[]) => Promise<any>>();
        const getLatestExecutionId = jest.fn<(...args: any[]) => Promise<any>>();

        function getTrace(path: string, searchParams: Record<string, string> = {}) {
            return got(`${baseUrl}/v1/${path}/trace`, {
                searchParams,
                responseType: 'json',
                throwHttpErrors: false
            });
        }

        beforeAll(() => {
            context.services.executionService.getSliceTrace = getSliceTrace;
            context.services.jobsService.getLatestExecutionId = getLatestExecutionId;
        });

        beforeEach(() => {
            getSliceTrace.mockReset().mockResolvedValue(traceResults);
            getLatestExecutionId.mockReset().mockResolvedValue(exId);
        });

        it('should trace the latest execution of a job with the default size', async () => {
            const response = await getTrace('jobs/some-job-id');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual(traceResults);
            expect(getLatestExecutionId).toHaveBeenCalledWith('some-job-id');
            expect(getSliceTrace).toHaveBeenCalledWith(exId, { size: 10 });
        });

        it('should trace an execution by id without looking up the job', async () => {
            const response = await getTrace('ex/other-ex-id');

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual(traceResults);
            expect(getLatestExecutionId).not.toHaveBeenCalled();
            expect(getSliceTrace).toHaveBeenCalledWith('other-ex-id', { size: 10 });
        });

        it('should pass the validated size to the execution service', async () => {
            const response = await getTrace('ex/some-ex-id', { size: 'all' });

            expect(response.statusCode).toEqual(200);
            expect(getSliceTrace).toHaveBeenCalledWith(exId, { size: 0 });
        });

        it('should respond with a 400 for an invalid size', async () => {
            const response = await getTrace('jobs/some-job-id', { size: '2.5' });

            expect(response.statusCode).toEqual(400);
            expect(response.body).toMatchObject({
                message: expect.stringContaining('Argument "size" must be "all", 0, or a positive integer')
            });
            expect(getSliceTrace).not.toHaveBeenCalled();
        });

        it('should respond with a 404 when the job has no executions', async () => {
            getLatestExecutionId.mockResolvedValue(undefined);

            const response = await getTrace('jobs/some-job-id');

            expect(response.statusCode).toEqual(404);
            expect(getSliceTrace).not.toHaveBeenCalled();
        });

        it('should respond with a 500 when the trace fails', async () => {
            getSliceTrace.mockRejectedValue(new Error('No client found by that id "some-ex-id"'));

            const response = await getTrace('ex/some-ex-id');

            expect(response.statusCode).toEqual(500);
            expect(response.body).toMatchObject({
                message: expect.stringContaining('No client found by that id')
            });
        });
    });
});
