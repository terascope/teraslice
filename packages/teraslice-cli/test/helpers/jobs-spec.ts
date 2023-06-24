/* eslint-disable jest/no-focused-tests */
import path from 'path';
import nock from 'nock';
import Jobs from '../../src/helpers/jobs';
import Config from '../../src/helpers/config';

// args, cli config, teraslice server
const tsHost = 'http://test-host';
const jobId = 'test-job';

describe('Job helper class', () => {
    const tsClient = nock(`${tsHost}`);

    describe('initialize', () => {
        it('should add job metadata to jobs property', async () => {
            tsClient.get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId));

            const config = buildCLIConfig('stop', {});

            const job = new Jobs(config);

            await job.initialize();

            const { jobs } = job;

            expect(jobs.length).toBe(1);
            expect(jobs[0].id).toBe('test-job');
            expect(jobs[0].api).toBeDefined();
            expect(jobs[0].status).toBe('stopped');
            expect(jobs[0].config).toEqual(testJobConfig(jobId));
        });

        it('should add multiple job metdata to jobs property', async () => {
            const job2Id = 'test-job2';

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${job2Id}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .get(`/v1/jobs/${job2Id}`)
                .reply(200, testJobConfig(job2Id));

            const config = buildCLIConfig(
                'stop',
                {
                    'job-id': [jobId, job2Id],
                    jobId: [jobId, job2Id]
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            const { jobs } = job;

            expect(jobs.length).toBe(2);

            expect(jobs[0].id).toBe(jobId);
            expect(jobs[0].api).toBeDefined();
            expect(jobs[0].status).toBe('stopped');
            expect(jobs[0].config).toEqual(testJobConfig(jobId));

            expect(jobs[1].id).toBe(job2Id);
            expect(jobs[1].api).toBeDefined();
            expect(jobs[1].status).toBe('stopped');
            expect(jobs[1].config).toEqual(testJobConfig(job2Id));
        });

        it('should add all jobs on a cluster to jobs property', async () => {
            // add this test
        });

        it('should only add the jobs that match the specified status', async () => {
            // add this test
        });

        it('should throw an error if no jobs match the status', async () => {
            // add this test
        });
    });
});

function testJobConfig(id: string) {
    return {
        name: 'test-job',
        lifecycle: 'persistent',
        workers: 1,
        assets: [
            'asset1:2.7.4',
            'asset2:0.14.1'
        ],
        operations: [
            {
                _op: 'read_data',
                start: '2020-01-01',
                format: 'isoBetween',
                size: 100000
            },
            {
                _op: 'noop'
            }
        ],
        _created: '2021-08-25T19:49:55.956Z',
        job_id: id,
        _context: 'job',
        _updated: '2023-06-21T21:14:14.208Z'
    };
}

function buildCLIConfig(action: string, overwrite = {}) {
    let testArgs = {
        _: ['jobs', action],
        'job-id': [jobId],
        jobId: [jobId],
        'config-dir': path.join(__dirname, '..', 'fixtures', 'job_saves'),
        d: path.join(__dirname, '..', 'fixtures', 'job_saves'),
        configDir: path.join(__dirname, '..', 'fixtures', 'job_saves'),
        output: 'txt',
        o: 'txt',
        status: [],
        yes: false,
        y: false,
        $0: '/usr/local/bin/earl',
        'cluster-alias': 'testerTest',
        clusterAlias: 'testerTest'
    };

    testArgs = Object.assign(testArgs, overwrite);

    return new Config(testArgs);
}
