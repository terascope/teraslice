import 'jest-extended';
import nock from 'nock';
import { Teraslice } from '@terascope/types';
import Job from '../src/job.js';
import Jobs from '../src/jobs.js';

describe('Teraslice Jobs', () => {
    let jobs: Jobs;
    let scope: nock.Scope;

    beforeEach(() => {
        jobs = new Jobs({
            baseUrl: 'http://teraslice.example.dev'
        });

        scope = nock('http://teraslice.example.dev/v1');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    const date = new Date().toISOString();

    const list: Teraslice.JobConfig[] = [
        {
            job_id: 'some-random-job-id',
            active: true,
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
            _created: date,
            _updated: date,
            _context: 'job'
        },
    ];

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
                // @ts-expect-error
                expect(() => jobs.wrap()).toThrow('Job requires jobId');
            });
        });
    });

    describe('->submit', () => {
        describe('when submitting without a jobSpec', () => {
            it('should fail', async () => {
                expect.hasAssertions();
                try {
                    // @ts-expect-error
                    await jobs.submit();
                } catch (err) {
                    expect(err.message).toEqual('Submit requires a jobSpec');
                }
            });
        });

        describe('when submitting with a valid jobSpec', () => {
            const jobSpec = {
                operations: [{ _op: 'operation' }]
            };

            const response = {
                ex_id: 'some-ex-id',
                job_id: 'some-job-id'
            };

            beforeEach(() => {
                scope.post('/jobs', jobSpec)
                    .query({ start: true })
                    .reply(202, response);
            });

            it('should resolve an instanceof a Job', async () => {
                const job = await jobs.submit(jobSpec);
                expect(job).toBeInstanceOf(Job);
                expect(job.id()).toEqual(response.job_id);
            });
        });

        describe('when submitting with a valid and start is set false', () => {
            const jobSpec = {
                operations: [{ _op: 'operation' }]
            };

            const response = {
                ex_id: 'some-ex-id',
                job_id: 'some-job-id'
            };

            beforeEach(() => {
                scope.post('/jobs', jobSpec)
                    .query({ start: false })
                    .reply(202, response);
            });

            it('should resolve an instanceof a Job', async () => {
                const job = await jobs.submit(jobSpec, true);
                expect(job).toBeInstanceOf(Job);
                expect(job.id()).toEqual(response.job_id);
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
                    // @ts-expect-error
                    await jobs.submit(jobSpec);
                } catch (err) {
                    expect(err.message).toEqual('No job was posted');
                }
            });
        });
    });

    describe('->list', () => {
        describe('when called with nothing', () => {
            beforeEach(() => {
                scope.get('/jobs')
                    .reply(200, list);
            });

            it('should resolve json result from Teraslice', async () => {
                const results = await jobs.list();
                expect(results).toEqual(list);
            });
        });

        describe('when called with a query and search objects', () => {
            const searchOptions = { headers: { 'Some-Header': 'yes' } };
            const queryOptions = { active: true, size: 10 };

            beforeEach(() => {
                scope.get('/jobs')
                    .query(queryOptions)
                    .matchHeader('Some-Header', 'yes')
                    .reply(200, list);
            });

            it('should resolve json result from Teraslice', async () => {
                const results = await jobs.list(queryOptions, searchOptions);
                expect(results).toEqual(list);
            });
        });
    });
});
