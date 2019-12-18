import nock from 'nock';
import { RecoveryCleanupType, newTestJobConfig } from '@terascope/job-components';
import Job from '../src/job';
import {
    ExecutionStatus,
    Execution,
    ClusterStateNative,
    WorkerJobProcesses,
    JobConfiguration
} from '../src/interfaces';

describe('Teraslice Job', () => {
    let scope: nock.Scope;
    const baseUrl = 'http://teraslice.example.dev/v1';

    beforeEach(() => {
        nock.cleanAll();
        scope = nock(baseUrl);
    });

    const requestOptions = { headers: { 'Some-Header': 'yes' } };

    const clusterState: ClusterStateNative = {
        'some-node-id': {
            hostname: 'host',
            pid: 111,
            node_version: '10',
            teraslice_version: 'fabled v1.0',
            total: 2,
            state: 'connected',
            available: 3,
            node_id: 'some-node-id',
            active: [
                {
                    job_id: 'some-job-id',
                    ex_id: 'some-ex-id',
                    worker_id: 'someId',
                    pid: 1324,
                    assignment: 'worker'
                },
                {
                    job_id: 'some-job-id',
                    ex_id: 'some-ex-id',
                    worker_id: 'someId',
                    pid: 1324,
                    assignment: 'worker'
                }
            ]
        },
        'some-other-node-id': {
            hostname: 'host',
            pid: 222,
            node_version: '10',
            teraslice_version: 'fabled v1.0',
            total: 2,
            state: 'connected',
            available: 3,
            node_id: 'some-other-node-id',
            active: [
                {
                    job_id: 'some-job-id',
                    ex_id: 'some-ex-id',
                    worker_id: 'someId',
                    pid: 1324,
                    assignment: 'worker'
                },
                {
                    job_id: 'some-other-job-id',
                    ex_id: 'some-other-ex-id',
                    worker_id: 'someId',
                    pid: 1324,
                    assignment: 'worker'
                },
                {
                    job_id: 'some-other-job-id',
                    ex_id: 'some-other-ex-id',
                    worker_id: 'someId',
                    pid: 1324,
                    assignment: 'execution_controller'
                }
            ]
        }
    };
    const date = new Date().toISOString();

    const executionResults: Execution[] = [
        {
            analytics: false,
            assets: [],
            assetIds: [],
            lifecycle: 'once',
            max_retries: 3,
            name: 'some_name',
            apis: [],
            operations: [{ _op: 'someOp' }],
            probation_window: 3,
            performance_metrics: false,
            env_vars: {},
            slicers: 1,
            workers: 1,
            metadata: {},
            _created: date,
            _updated: date,
            _context: 'ex',
            _status: ExecutionStatus.running,
            ex_id: '123456789',
            job_id: '123456789',
            slicer_hostname: 'hostname',
            slicer_port: 5673
        },
    ];

    describe('->id', () => {
        describe('when constructed without a jobId', () => {
            it('should throw an error', () => {
                // @ts-ignore
                expect(() => new Job()).toThrowError('Job requires jobId');
            });
        });

        describe('when constructed with a invalid jobId', () => {
            it('should throw an error', () => {
                // @ts-ignore
                expect(() => new Job({}, { invalid: true })).toThrowError('Job requires jobId to be a string');
            });
        });

        describe('when constructed with a jobId', () => {
            it('should return the jobId', () => {
                const job = new Job({}, 'some-job-id');
                expect(job.id()).toEqual('some-job-id');
            });
        });
    });

    describe('->slicer', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/slicer')
                    .reply(200, { id: 'example' });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.slicer();
                expect(results).toEqual({ id: 'example' });
            });
        });
    });

    describe('->controller', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/controller')
                    .reply(200, { id: 'example' });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.controller();
                expect(results).toEqual({ id: 'example' });
            });
        });

        describe('when called with options', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/controller')
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, { foo: 'bar' });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.controller(requestOptions);
                expect(results).toEqual({ foo: 'bar' });
            });
        });
    });

    const methodTestCases: string[] = [
        'start',
        'stop',
        'pause',
        'resume'
    ];
    describe.each(methodTestCases)('->%s', (method: string) => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.post(`/jobs/some-job-id/_${method}`)
                    .reply(200, { testMethod: method });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job[method]();
                expect(results).toEqual({ testMethod: method });
            });
        });

        describe('when called with a query', () => {
            beforeEach(() => {
                scope.post(`/jobs/some-job-id/_${method}`)
                    .query({ someParam: 'yes' })
                    .reply(200, { key: 'some-other-key' });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job[method]({ someParam: 'yes' });
                expect(results).toEqual({ key: 'some-other-key' });
            });
        });

        describe('when called with a query and options', () => {
            beforeEach(() => {
                scope.post(`/jobs/some-job-id/_${method}`)
                    .query({ foo: 'bar' })
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, { key: 'some-random-key' });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job[method]({ foo: 'bar' }, requestOptions);
                expect(results).toEqual({ key: 'some-random-key' });
            });
        });
    });

    describe('->recover', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.post('/jobs/some-other-job-id/_recover')
                    .reply(200, { job_id: 'some-other-job-id' });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-other-job-id');
                const results = await job.recover();
                expect(results).toEqual({ job_id: 'some-other-job-id' });
            });
        });

        describe('when called with a query', () => {
            beforeEach(() => {
                scope.post('/jobs/foo-bar/_recover')
                    .query({ cleanup: 'errors' })
                    .reply(200, { job_id: 'foo-bar' });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'foo-bar');
                const results = await job.recover({
                    cleanup: RecoveryCleanupType.errors
                });
                expect(results).toEqual({ job_id: 'foo-bar' });
            });
        });

        describe('when called with a query and options', () => {
            beforeEach(() => {
                scope.post('/jobs/some-job-id/_recover')
                    .matchHeader('Some-Header', 'yes')
                    .query({ cleanup: 'errors' })
                    .reply(200, {
                        key: 'some-other-key'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.recover({
                    cleanup: RecoveryCleanupType.errors
                }, requestOptions);
                expect(results).toEqual({
                    key: 'some-other-key'
                });
            });
        });
    });

    describe('->execution', () => {
        const exJobId = executionResults[0].job_id;
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get(`/jobs/${exJobId}/ex`)
                    .reply(200, executionResults);
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, exJobId);
                const results = await job.execution();
                expect(results).toEqual(executionResults);
            });
        });

        describe('when called with options', () => {
            beforeEach(() => {
                scope.get(`/jobs/${exJobId}/ex`)
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, executionResults);
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, exJobId);
                const results = await job.execution(requestOptions);
                expect(results).toEqual(executionResults);
            });
        });
    });

    describe('->update', () => {
        describe('when updating the whole config', () => {
            const body = newTestJobConfig({
                name: 'hello',
            }) as JobConfiguration;
            body.job_id = 'some-job-id';
            body._created = 'hello';
            body._updated = 'hello';

            beforeEach(() => {
                scope.put('/jobs/some-job-id', body as any)
                    .reply(200, body);
            });

            it('should resolve the update job config', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const result = await job.update(body);
                expect(result).toEqual(body);
            });
        });
    });

    describe('->updatePartial', () => {
        describe('when updating a partial config', () => {
            const body = newTestJobConfig({
                name: 'hello',
            }) as JobConfiguration;
            body.job_id = 'some-job-id';
            body._created = 'hello';
            body._updated = 'hello';
            const expected = {
                ...body,
                name: 'howdy'
            };

            beforeEach(() => {
                scope.get('/jobs/some-job-id')
                    .reply(200, body);
                scope.put('/jobs/some-job-id', expected as any)
                    .reply(200, expected);
            });

            it('should resolve the update job config', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const result = await job.updatePartial({ name: 'howdy' });
                expect(result).toEqual(expected);
            });
        });
    });

    describe('->exId', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/ex')
                    .reply(200, { ex_id: 'example-ex-id' });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.exId();
                expect(results).toEqual('example-ex-id');
            });
        });

        describe('when called with options', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/ex')
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, { ex_id: 'other-ex-id' });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.exId(requestOptions);
                expect(results).toEqual('other-ex-id');
            });
        });
    });

    describe('->status', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'example'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.status();
                expect(results).toEqual('example');
            });
        });

        describe('when called with options', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/ex')
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'other-status'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.status(requestOptions);
                expect(results).toEqual('other-status');
            });
        });
    });

    describe('->config', () => {
        describe('when called with nothing', () => {
            const data = {
                job_id: 'example-job-id',
                ex_id: 'example-ex-id',
                example: 'job-spec'
            };

            beforeEach(() => {
                scope.get('/jobs/example-job-id')
                    .reply(200, data);
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'example-job-id');
                const results = await job.config();
                expect(results).toEqual(data);
            });
        });

        describe('when called with with options', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id')
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, {
                        job_id: 'example-job-id',
                        ex_id: 'example-ex-id',
                        example: 'job-spec'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.config(requestOptions);
                expect(results).toEqual({
                    job_id: 'example-job-id',
                    ex_id: 'example-ex-id',
                    example: 'job-spec'
                });
            });
        });
    });

    describe('->errors', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/errors')
                    .reply(200, [
                        { error: 'example' },
                        { error: 'example-2' }
                    ]);
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.errors();
                expect(results).toEqual([
                    { error: 'example' },
                    { error: 'example-2' }
                ]);
            });
        });
    });

    describe('->workers', () => {
        const workerData: WorkerJobProcesses[] = [];

        const jobId = 'some-job-id';
        for (const [nodeName, node] of Object.entries(clusterState)) {
            node.active.forEach((child) => {
                if (child.assignment === 'worker' && child.job_id === jobId) {
                    // @ts-ignore
                    child.node_id = nodeName;
                    // @ts-ignore
                    workerData.push(child);
                }
            });
        }

        describe('when called and the state has workers', () => {
            beforeEach(() => {
                scope.get('/cluster/state')
                    .reply(200, clusterState);
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, jobId);
                const results = await job.workers();
                expect(results).toEqual(workerData);
            });
        });

        describe('when called and the state has workers (with headers)', () => {
            beforeEach(() => {
                scope.get('/cluster/state')
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, clusterState);
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.workers(requestOptions);

                expect(results).toEqual(workerData);
            });
        });
    });

    describe('->changeWorkers', () => {
        const response = { message: 'Changed workers!' };

        describe('when response returns a string', () => {
            const oldStrResponse = 'hello';

            beforeEach(() => {
                scope.post('/jobs/some-job-id/_workers')
                    .query({ add: 2 })
                    .reply(200, oldStrResponse);
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.changeWorkers('add', 2);
                expect(results).toEqual(oldStrResponse);
            });
        });

        describe('when called with add and num', () => {
            beforeEach(() => {
                scope.post('/jobs/some-job-id/_workers')
                    .query({ add: 2 })
                    .reply(200, response);
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.changeWorkers('add', 2);
                expect(results).toEqual(response);
            });
        });

        describe('when called with remove and num', () => {
            beforeEach(() => {
                scope.post('/jobs/some-job-id/_workers')
                    .query({ remove: 2 })
                    .reply(200, response);
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.changeWorkers('remove', 2);
                expect(results).toEqual(response);
            });
        });

        describe('when called with total and num', () => {
            beforeEach(() => {
                scope.post('/jobs/some-job-id/_workers')
                    .query({ total: 2 })
                    .reply(200, response);
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.changeWorkers('total', 2);
                expect(results).toEqual(response);
            });
        });

        describe('when called with nothing', () => {
            it('should reject with an error', async () => {
                expect.hasAssertions();
                const job = new Job({ baseUrl }, 'some-job-id');
                try {
                    // @ts-ignore
                    await job.changeWorkers();
                } catch (err) {
                    expect(err.message).toEqual('changeWorkers requires action and count');
                }
            });
        });

        describe('when called with an invalid action', () => {
            it('should reject with an error', async () => {
                expect.hasAssertions();
                const job = new Job({ baseUrl }, 'some-job-id');
                try {
                    // @ts-ignore
                    await job.changeWorkers('invalid', 2);
                } catch (err) {
                    expect(err.message).toEqual('changeWorkers requires action to be one of add, remove, or total');
                }
            });
        });
    });

    describe('->waitForStatus', () => {
        describe('when called and it matches on the first try', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: ExecutionStatus.running
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.waitForStatus(ExecutionStatus.running);
                expect(results).toEqual(ExecutionStatus.running);
            });
        });

        describe('when called and it matches on the first try (with headers)', () => {
            const searchOptions = { headers: { 'Some-Header': 'yes' } };

            beforeEach(() => {
                scope.get('/jobs/some-job-id/ex')
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: ExecutionStatus.running
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.waitForStatus(
                    ExecutionStatus.running,
                    1000,
                    0, searchOptions
                );
                expect(results).toEqual(ExecutionStatus.running);
            });
        });

        describe('when called and it matches on the second try', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: ExecutionStatus.running
                    });

                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: ExecutionStatus.completed
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const results = await job.waitForStatus(ExecutionStatus.completed);
                expect(results).toEqual(ExecutionStatus.completed);
            });
        });

        describe('when called and it never matches', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/ex')
                    .times(1)
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: ExecutionStatus.initializing
                    });

                scope.get('/jobs/some-job-id/ex')
                    .times(11)
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: ExecutionStatus.running
                    });
            });

            it('should reject with a timeout error', async () => {
                expect.hasAssertions();
                const job = new Job({ baseUrl }, 'some-job-id');
                try {
                    await job.waitForStatus(ExecutionStatus.completed, 100, 1000);
                } catch (err) {
                    expect(err.message).toEqual('Job status failed to change from status "running" to "completed" within 1000ms');
                }
            });
        });

        describe('when called and one request times out', () => {
            beforeEach(() => {
                scope.get('/jobs/some-job-id/ex')
                    .delay(1100)
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: ExecutionStatus.initializing
                    });

                scope.get('/jobs/some-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: ExecutionStatus.running
                    });
            });

            it('should resolve with the correct status', async () => {
                const job = new Job({ baseUrl }, 'some-job-id');
                const status = await job.waitForStatus(ExecutionStatus.running, 100, 1500);
                expect(status).toEqual(ExecutionStatus.running);
            });
        });

        describe('when called and returns a terminal status', () => {
            beforeEach(() => {
                scope.get('/jobs/other-job-id/ex')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: ExecutionStatus.failed
                    });
            });

            it('should reject with a terminal status error', async () => {
                expect.hasAssertions();
                const job = new Job({ baseUrl }, 'other-job-id');
                try {
                    await job.waitForStatus(ExecutionStatus.completed, 100, 1000);
                } catch (err) {
                    const errMsg = 'Job cannot reach the target status, "completed", because it is in the terminal state, "failed"';
                    expect(err.message).toEqual(errMsg);
                }
            });
        });
    });
});
