import nock from 'nock';
import Ex from '../src/ex.js';
import Executions from '../src/executions.js';

describe('Teraslice Executions', () => {
    let executions: Executions;
    let scope: nock.Scope;

    beforeEach(() => {
        executions = new Executions({
            baseUrl: 'http://teraslice.example.dev'
        });
        scope = nock('http://teraslice.example.dev/v1');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('->submit', () => {
        describe('when submitting without a jobSpec', () => {
            it('should fail', async () => {
                expect.hasAssertions();
                try {
                    // @ts-expect-error
                    await executions.submit();
                } catch (err) {
                    expect(err.message).toEqual('Submit requires a jobSpec');
                }
            });
        });

        describe('when submitting with a valid jobSpec', () => {
            const jobSpec = {
                operations: [{ _op: 'operation' }]
            };

            beforeEach(() => {
                scope.post('/jobs', jobSpec)
                    .query({ start: true })
                    .reply(202, {
                        ex_id: 'some-execution-id',
                        job_id: 'some-job-id'
                    });
            });

            it('should resolve an instanceof a Job', async () => {
                const instance = await executions.submit(jobSpec);
                expect(instance).toBeInstanceOf(Ex);
                expect(instance.id()).toEqual('some-execution-id');
            });
        });

        describe('when submitting with a valid and start is set false', () => {
            const jobSpec = {
                operations: [{ _op: 'operation' }]
            };

            beforeEach(() => {
                scope.post('/jobs', jobSpec)
                    .query({ start: false })
                    .reply(202, { job_id: 'some-job-id', ex_id: 'foobar' });
            });

            it('should resolve an instanceof a Job', async () => {
                const instance = await executions.submit(jobSpec, true);
                expect(instance).toBeInstanceOf(Ex);
                expect(instance.id()).toEqual('foobar');
            });
        });

        describe('when submitting and the request fails', () => {
            const jobSpec = {
                operations: [{ _op: 'operation' }]
            };

            beforeEach(() => {
                scope.post('/jobs', jobSpec)
                    .query({ start: true })
                    .reply(500, 'Unable to process request');
            });

            it('should reject with the error message from the server', async () => {
                expect.hasAssertions();
                try {
                    await executions.submit(jobSpec);
                } catch (err) {
                    expect(err.message).toEqual('Unable to process request');
                }
            });
        });

        describe('when submitting without operations', () => {
            const jobSpec = {
                some_job: true
            };

            beforeEach(() => {
                scope.post('/jobs', jobSpec)
                    .query({ start: true })
                    .reply(400, 'No job was posted');
            });

            it('should have a message of No job was posted', async () => {
                expect.hasAssertions();
                try {
                    await executions.submit(jobSpec as any);
                } catch (err) {
                    expect(err.message).toEqual('No job was posted');
                }
            });
        });
    });

    describe('->list', () => {
        describe('when called with nothing', () => {
            const data = [
                {
                    id: 'example'
                },
                {
                    id: 'example-other'
                }
            ];

            beforeEach(() => {
                scope.get('/ex')
                    .query({})
                    .reply(200, data);
            });

            it('should resolve json results from Teraslice', async () => {
                const results = await executions.list();
                expect(results).toEqual(data);
            });
        });

        describe('when called with a string', () => {
            const data = [
                {
                    id: 'hello-example'
                },
                {
                    id: 'hello-example-2'
                }
            ];

            beforeEach(() => {
                scope.get('/ex')
                    .query({ status: 'hello' })
                    .reply(200, data);
            });

            it('should resolve json results from Teraslice', async () => {
                const results = await executions.list('hello');
                expect(results).toEqual(data);
            });
        });

        describe('when called with an object', () => {
            const data = [
                {
                    id: 'object-example'
                },
                {
                    id: 'object-example-2'
                }
            ];

            beforeEach(() => {
                scope.get('/ex')
                    .query({ anything: true })
                    .reply(200, data);
            });

            it('should resolve json results from Teraslice', async () => {
                const results = await executions.list({ anything: true });
                expect(results).toEqual(data);
            });
        });
    });

    describe('->errors', () => {
        describe('when called with nothing', () => {
            const errors = [
                {
                    slice_id: 'hello',
                    slicer_id: 0,
                    slicer_order: 1,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                },
                {
                    slice_id: 'hello-there',
                    slicer_id: 0,
                    slicer_order: 2,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                }
            ];

            beforeEach(() => {
                scope.get('/ex/errors')
                    .query({ size: 10 })
                    .reply(200, errors);
            });

            it('should resolve json results from Teraslice', async () => {
                const results = await executions.errors({ size: 10 });
                expect(results).toEqual(errors);
            });
        });

        describe('when called with an exId', () => {
            const errors = [
                {
                    slice_id: 'hello',
                    slicer_id: 0,
                    slicer_order: 1,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                },
                {
                    slice_id: 'hello-there',
                    slicer_id: 0,
                    slicer_order: 2,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                }
            ];

            beforeEach(() => {
                scope.get('/ex/foo/errors')
                    .query({ from: 10 })
                    .reply(200, errors);
            });

            it('should resolve json results from Teraslice', async () => {
                const results = await executions.errors('foo', { from: 10, });
                expect(results).toEqual(errors);
            });
        });
    });
});
