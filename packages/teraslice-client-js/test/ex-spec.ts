import nock from 'nock';
import { Teraslice } from '@terascope/types';
import Ex from '../src/ex.js';

describe('Teraslice Ex', () => {
    let scope: nock.Scope;
    const baseUrl = 'http://teraslice.example.dev/v1';

    beforeEach(() => {
        nock.cleanAll();
        scope = nock(baseUrl);
    });

    const requestOptions = { headers: { 'Random-Header': 'true' } };

    const clusterState: any = {
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
                    job_id: 'some-other-ex-id',
                    ex_id: 'some-other-ex-id',
                    worker_id: 'someId',
                    pid: 1324,
                    assignment: 'execution_controller'
                }
            ]
        }
    };

    describe('->id', () => {
        describe('when constructed without a exId', () => {
            it('should throw an error', () => {
                // @ts-expect-error
                expect(() => new Ex()).toThrow('Ex requires exId');
            });
        });

        describe('when constructed with a invalid exId', () => {
            it('should throw an error', () => {
                // @ts-expect-error
                expect(() => new Ex({}, { invalid: true })).toThrow('Ex requires exId to be a string');
            });
        });

        describe('when constructed with a exId', () => {
            it('should return the exId', () => {
                const ex = new Ex({}, 'some-ex-id');
                expect(ex.id()).toEqual('some-ex-id');
            });
        });
    });

    describe('->slicer', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/ex/some-ex-id/slicer')
                    .reply(200, { foo: 'bar' });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.slicer();
                expect(results).toEqual({ foo: 'bar' });
            });
        });
    });

    describe('->controller', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/ex/some-ex-id/controller')
                    .reply(200, { foo: 'bar2' });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.controller();
                expect(results).toEqual({ foo: 'bar2' });
            });
        });

        describe('when called with options', () => {
            beforeEach(() => {
                scope.get('/ex/some-ex-id/controller')
                    .matchHeader('Random-Header', 'true')
                    .reply(200, { hello: true });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.controller(requestOptions);
                expect(results).toEqual({ hello: true });
            });
        });
    });

    const methodTestCases = [
        'stop',
        'pause',
        'resume'
    ] as const;
    describe.each(methodTestCases)('->%s', (method) => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.post(`/ex/some-ex-id/_${method}`)
                    .reply(200, { example: method });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex[method]();
                expect(results).toEqual({ example: method });
            });
        });

        describe('when called with a query', () => {
            const data = { key: 'some-other-key' };

            beforeEach(() => {
                scope.post(`/ex/some-ex-id/_${method}`)
                    .query({ foo: 'bar' })
                    .reply(200, data);
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex[method]({ foo: 'bar' });
                expect(results).toEqual(data);
            });
        });

        describe('when called with a query and options', () => {
            beforeEach(() => {
                scope.post(`/ex/some-ex-id/_${method}`)
                    .query({ bar: 'foo' })
                    .matchHeader('Random-Header', 'true')
                    .reply(200, { random: 'data' });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex[method]({ bar: 'foo' }, requestOptions);
                expect(results).toEqual({ random: 'data' });
            });
        });
    });

    describe('->recover', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.post('/ex/some-ex-id/_recover')
                    .reply(200, { job_id: 'new-job-id' });

                scope.get('/jobs/new-job-id/ex')
                    .reply(200, {
                        ex_id: 'new-ex-id',
                        job_id: 'new-job-id'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const instance = await ex.recover();

                expect(instance).toBeInstanceOf(Ex);
                expect(instance.id()).toEqual('new-ex-id');
            });
        });

        describe('when called with a query', () => {
            beforeEach(() => {
                scope.post('/ex/some-ex-id/_recover')
                    .query({ cleanup: Teraslice.RecoveryCleanupType.errors })
                    .reply(200, {
                        job_id: 'some-job-key',
                        ex_id: 'some-ex-key'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const instance = await ex.recover({
                    cleanup: Teraslice.RecoveryCleanupType.errors
                });

                expect(instance).toBeInstanceOf(Ex);
                expect(instance.id()).toEqual('some-ex-key');
            });
        });

        describe('when called with a query and options', () => {
            beforeEach(() => {
                scope.post('/ex/some-ex-id/_recover')
                    .matchHeader('Random-Header', 'true')
                    .query({ cleanup: 'errors' })
                    .reply(200, {
                        job_id: 'some-job-key',
                        ex_id: 'some-ex-key'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const instance = await ex.recover({
                    cleanup: Teraslice.RecoveryCleanupType.errors
                }, requestOptions);

                expect(instance).toBeInstanceOf(Ex);
                expect(instance.id()).toEqual('some-ex-key');
            });
        });
    });

    describe('->status', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/ex/some-ex-id')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: 'example'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.status();
                expect(results).toEqual('example');
            });
        });

        describe('when called with options', () => {
            beforeEach(() => {
                scope.get('/ex/some-ex-id')
                    .matchHeader('Random-Header', 'true')
                    .reply(200, {
                        ex_id: 'some-ex-id',
                        _status: 'other-example'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.status(requestOptions);
                expect(results).toEqual('other-example');
            });
        });
    });

    describe('->config', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/ex/some-ex-id')
                    .reply(200, {
                        ex_id: 'some-ex-id',
                        job_id: 'example-job-id',
                        example: 'ex-spec'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.config();
                expect(results).toEqual({
                    ex_id: 'some-ex-id',
                    job_id: 'example-job-id',
                    example: 'ex-spec'
                });
            });
        });

        describe('when called with with options', () => {
            beforeEach(() => {
                scope.get('/ex/example-ex-id')
                    .matchHeader('Random-Header', 'true')
                    .reply(200, {
                        job_id: 'example-job-id',
                        ex_id: 'example-ex-id',
                        example: 'ex-spec'
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'example-ex-id');
                const results = await ex.config(requestOptions);
                expect(results).toEqual({
                    job_id: 'example-job-id',
                    ex_id: 'example-ex-id',
                    example: 'ex-spec'
                });
            });
        });
    });

    describe('->errors', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/ex/some-ex-id/errors')
                    .reply(200, [
                        { error: 'example' },
                        { error: 'example-2' }
                    ]);
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.errors();
                expect(results).toEqual([
                    { error: 'example' },
                    { error: 'example-2' }
                ]);
            });
        });
    });

    describe('->workers', () => {
        const workerData: Teraslice.WorkerNode[] = [];

        const exId = 'some-ex-id';
        for (const [nodeName, node] of Object.entries(clusterState)) {
            // @ts-expect-error TODO: fixme
            node.active.forEach((child: any) => {
                if (child.assignment === 'worker' && child.ex_id === exId) {
                    child.node_id = nodeName;
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
                const ex = new Ex({ baseUrl }, exId);
                const results = await ex.workers();
                expect(results).toEqual(workerData);
            });
        });

        describe('when called and the state has workers (with options)', () => {
            beforeEach(() => {
                scope.get('/cluster/state')
                    .matchHeader('Random-Header', 'true')
                    .reply(200, clusterState);
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, exId);
                const results = await ex.workers(requestOptions);

                expect(results).toEqual(workerData);
            });
        });
    });

    describe('->changeWorkers', () => {
        const response = { message: 'Changed workers!' };

        describe('when response returns a string', () => {
            const oldStrResponse = 'hello';

            beforeEach(() => {
                scope.post('/ex/some-ex-id/_workers')
                    .query({ add: 2 })
                    .reply(200, oldStrResponse);
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.changeWorkers('add', 2);
                expect(results).toEqual(oldStrResponse);
            });
        });

        describe('when called with add and num', () => {
            beforeEach(() => {
                scope.post('/ex/some-ex-id/_workers')
                    .query({ add: 2 })
                    .reply(200, response);
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.changeWorkers('add', 2);
                expect(results).toEqual(response);
            });
        });

        describe('when called with remove and num', () => {
            beforeEach(() => {
                scope.post('/ex/some-ex-id/_workers')
                    .query({ remove: 2 })
                    .reply(200, response);
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.changeWorkers('remove', 2);
                expect(results).toEqual(response);
            });
        });

        describe('when called with total and num', () => {
            beforeEach(() => {
                scope.post('/ex/some-ex-id/_workers')
                    .query({ total: 2 })
                    .reply(200, response);
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                const results = await ex.changeWorkers('total', 2);
                expect(results).toEqual(response);
            });
        });

        describe('when called with nothing', () => {
            it('should reject with an error', async () => {
                expect.hasAssertions();
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                try {
                    // @ts-expect-error
                    await ex.changeWorkers();
                } catch (err) {
                    expect(err.message).toEqual('Change workers requires action and count');
                }
            });
        });

        describe('when called with an invalid action', () => {
            it('should reject with an error', async () => {
                expect.hasAssertions();
                const ex = new Ex({ baseUrl }, 'some-ex-id');
                try {
                    // @ts-expect-error
                    await ex.changeWorkers('invalid', 2);
                } catch (err) {
                    expect(err.message).toEqual('Change workers requires action to be one of add, remove, or total');
                }
            });
        });
    });

    describe('->waitForStatus', () => {
        describe('when called and it matches on the first try', () => {
            beforeEach(() => {
                scope.get('/ex/example-ex-id')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        job_id: 'example-job-id',
                        _status: Teraslice.ExecutionStatusEnum.running
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'example-ex-id');
                const results = await ex.waitForStatus(Teraslice.ExecutionStatusEnum.running);
                expect(results).toEqual(Teraslice.ExecutionStatusEnum.running);
            });
        });

        describe('when called and it matches on the first try (with options)', () => {
            const searchOptions = { headers: { 'Other-Header': '1' } };

            beforeEach(() => {
                scope.get('/ex/example-ex-id')
                    .matchHeader('Other-Header', '1')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        job_id: 'example-job-id',
                        _status: Teraslice.ExecutionStatusEnum.running
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'example-ex-id');
                const results = await ex.waitForStatus(
                    Teraslice.ExecutionStatusEnum.running,
                    1000,
                    0,
                    searchOptions
                );
                expect(results).toEqual(Teraslice.ExecutionStatusEnum.running);
            });
        });

        describe('when called and it matches on the second try', () => {
            beforeEach(() => {
                scope.get('/ex/other-ex-id')
                    .reply(200, {
                        ex_id: 'other-ex-id',
                        _status: Teraslice.ExecutionStatusEnum.running
                    });

                scope.get('/ex/other-ex-id')
                    .reply(200, {
                        ex_id: 'other-ex-id',
                        _status: Teraslice.ExecutionStatusEnum.completed
                    });
            });

            it('should resolve json results from Teraslice', async () => {
                const ex = new Ex({ baseUrl }, 'other-ex-id');
                const results = await ex.waitForStatus(Teraslice.ExecutionStatusEnum.completed);
                expect(results).toEqual(Teraslice.ExecutionStatusEnum.completed);
            });
        });

        describe('when called and it never matches', () => {
            beforeEach(() => {
                scope.get('/ex/foo-bar-ex-id')
                    .times(12)
                    .reply(200, {
                        ex_id: 'foo-bar-ex-id',
                        _status: Teraslice.ExecutionStatusEnum.running
                    });
            });

            it('should reject with a timeout error', async () => {
                expect.hasAssertions();
                const ex = new Ex({ baseUrl }, 'foo-bar-ex-id');
                try {
                    await ex.waitForStatus(Teraslice.ExecutionStatusEnum.completed, 100, 1000);
                } catch (err) {
                    expect(err.message).toEqual('Execution status failed to change from status "running" to "completed" within 1000ms');
                }
            });
        });

        describe('when called and one request times out', () => {
            beforeEach(() => {
                scope.get('/ex/some-job-id')
                    .delay(1100)
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: Teraslice.ExecutionStatusEnum.initializing
                    });

                scope.get('/ex/some-job-id')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: Teraslice.ExecutionStatusEnum.running
                    });
            });

            it('should resolve with the correct status', async () => {
                const ex = new Ex({ baseUrl }, 'some-job-id');
                const status = await ex.waitForStatus(
                    Teraslice.ExecutionStatusEnum.running,
                    100,
                    1500
                );
                expect(status).toEqual(Teraslice.ExecutionStatusEnum.running);
            });
        });

        describe('when called and returns a terminal status', () => {
            beforeEach(() => {
                scope.get('/ex/example-ex-id')
                    .reply(200, {
                        ex_id: 'example-ex-id',
                        _status: Teraslice.ExecutionStatusEnum.failed
                    });
            });

            it('should reject with a terminal status error', async () => {
                expect.hasAssertions();
                const ex = new Ex({ baseUrl }, 'example-ex-id');
                try {
                    await ex.waitForStatus(Teraslice.ExecutionStatusEnum.completed, 100, 1000);
                } catch (err) {
                    const errMsg = 'Execution cannot reach the target status, "completed", because it is in the terminal state, "failed"';
                    expect(err.message).toEqual(errMsg);
                }
            });
        });
    });
});
