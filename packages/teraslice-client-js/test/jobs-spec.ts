
import 'jest-extended';
import nock from 'nock';
import Job from '../src/lib/job';
import Jobs from '../src/lib/jobs';

describe('Teraslice Jobs', () => {
    let jobs:Jobs;
    let scope:nock.Scope;

    beforeEach(() => {
        jobs = new Jobs({
            baseUrl: 'http://teraslice.example.dev'
        });

        scope = nock('http://teraslice.example.dev/v1');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('->wrap', () => {
        describe('when given a jobId', () => {
            it('should return a instance of a Job', () => {
                const jobId = 'some-job-id';
                const job = jobs.wrap(jobId);
                expect(job instanceof Job).toBeTrue();
                expect(job.id()).toEqual(jobId);
            });
        });

        describe('when given a nothing', () => {
            it('should throw an error', () => {
                // @ts-ignore
                expect(() => jobs.wrap()).toThrowError('Job requires jobId');
            });
        });
    });

    describe('->submit', () => {
        describe('when submitting without a jobSpec', () => {
            it('should fail', async () => {
                expect.hasAssertions();
                try {
                    // @ts-ignore
                    await jobs.submit();
                } catch (err) {
                    expect(err.message).toEqual('submit requires a jobSpec');
                }
            });
        });

        describe('when submitting with a valid jobSpec', () => {
            const jobSpec = {
                some_job: true,
                operations: [{ _op: 'operation' }]
            };

            const response = {
                job_id: 'some-job-id'
            };

            beforeEach(() => {
                scope.post('/jobs', jobSpec)
                    .query({ start: true })
                    .reply(202, response);
            });

            it('should resolve an instanceof a Job', async () => {
                const job = await jobs.submit(jobSpec);
                expect(job instanceof Job).toBeTrue();
                expect(job.id()).toEqual(response.job_id);
            });
        });

        describe('when submitting with a valid and start is set false', () => {
            const jobSpec = {
                some_job: true,
                operations: [{ _op: 'operation' }]
            };

            const response = { job_id: 'some-job-id' };

            beforeEach(() => {
                scope.post('/jobs', jobSpec)
                    .query({ start: false })
                    .reply(202, response);
            });

            it('should resolve an instanceof a Job', async () => {
                const job = await jobs.submit(jobSpec, true);
                expect(job instanceof Job).toBeTrue();
                expect(job.id()).toEqual(response.job_id);
            });
        });

        describe('when submitting and the request fails', () => {
            const jobSpec = {
                some_job: true,
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
                    await jobs.submit(jobSpec);
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
                    // @ts-ignore
                    await jobs.submit(jobSpec);
                } catch (err) {
                    expect(err.message).toEqual('No job was posted');
                }
            });
        });
    });

    describe('->list', () => {
        describe('when called with nothing', () => {
            const list = [{ id: 'example' }, { id: 'example-other' }];

            beforeEach(() => {
                scope.get('/jobs')
                    .query({ status: '*' })
                    .reply(200, list);
            });

            it('should resolve json result from Teraslice', async () => {
                const results = await jobs.list();
                expect(results).toEqual(list);
            });
        });

        describe('when called with a string', () => {
            const list = [{ id: 'hello-example' }, { id: 'hello-example-2' }];
            beforeEach(() => {
                scope.get('/jobs')
                    .query({ status: 'hello' })
                    .reply(200, list);
            });

            it('should resolve json result from Teraslice', async () => {
                const results = await jobs.list('hello');
                expect(results).toEqual(list);
            });
        });

        describe('when called with an object', () => {
            const list = [{ id: 'object-example' }, { id: 'object-example-2' }];
            const params = { anything: true };

            beforeEach(() => {
                scope.get('/jobs')
                    .query(params)
                    .reply(200, list);
            });

            it('should resolve json result from Teraslice', async () => {
                const results = await jobs.list(params);
                expect(results).toEqual(list);
            });
        });
    });
});
