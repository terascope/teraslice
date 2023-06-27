/* eslint-disable jest/no-focused-tests */
import nock from 'nock';
import Jobs from '../../src/helpers/jobs';
import {
    makeJobIds,
    testJobConfig,
    buildCLIConfig,
    clusterControllers
} from './helpers';

// args, cli config, teraslice server
const tsHost = 'http://test-host';

const tsClient = nock(tsHost);

describe('Job helper class', () => {
    describe('initialize', () => {
        it('should add job metadata to jobs property', async () => {
            const [jobId] = makeJobIds(1);

            tsClient.get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId));

            const config = buildCLIConfig('stop', { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            const { jobs } = job;

            expect(jobs.length).toBe(1);
            expect(jobs[0].id).toBe(jobId);
            expect(jobs[0].api).toBeDefined();
            expect(jobs[0].status).toBe('stopped');
            expect(jobs[0].config).toEqual(testJobConfig(jobId));
        });

        it('should add multiple job metdata to jobs property', async () => {
            const [job1, job2] = makeJobIds(2);

            tsClient
                .get(`/v1/jobs/${job1}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${job2}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${job1}`)
                .reply(200, testJobConfig(job1))
                .get(`/v1/jobs/${job2}`)
                .reply(200, testJobConfig(job2));

            const config = buildCLIConfig(
                'stop',
                {
                    'job-id': [job1, job2],
                    jobId: [job1, job2]
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            const { jobs } = job;

            expect(jobs.length).toBe(2);

            expect(jobs[0].id).toBe(job1);
            expect(jobs[0].api).toBeDefined();
            expect(jobs[0].status).toBe('stopped');
            expect(jobs[0].config).toEqual(testJobConfig(job1));

            expect(jobs[1].id).toBe(job2);
            expect(jobs[1].api).toBeDefined();
            expect(jobs[1].status).toBe('stopped');
            expect(jobs[1].config).toEqual(testJobConfig(job2));
        });

        it('should add all jobs on a cluster to jobs property', async () => {
            const jobIds = makeJobIds(3);

            const [job1, job2, job3] = jobIds;

            const controllerResults = clusterControllers(jobIds);

            tsClient
                .get('/v1/cluster/controllers')
                .reply(200, () => Promise.resolve(controllerResults))
                .get(`/v1/jobs/${job1}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${job2}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${job3}/ex`)
                .reply(200, { _status: 'failing' })
                .get(`/v1/jobs/${job1}`)
                .reply(200, testJobConfig(job1))
                .get(`/v1/jobs/${job2}`)
                .reply(200, testJobConfig(job2))
                .get(`/v1/jobs/${job3}`)
                .reply(200, testJobConfig(job3));

            const config = buildCLIConfig(
                'restart',
                {
                    'job-id': ['all'],
                    jobId: ['all'],
                    yes: true,
                    y: true
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs.length).toBe(3);
        });

        it('should only add the jobs that match the specified status', async () => {
            const jobIds = makeJobIds(3);

            const [job1, job2, job3] = jobIds;

            const controllerResults = clusterControllers(jobIds);

            tsClient
                .get('/v1/cluster/controllers')
                .reply(200, () => Promise.resolve(controllerResults))
                .get(`/v1/jobs/${job1}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${job2}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${job3}/ex`)
                .reply(200, { _status: 'failing' })
                .get(`/v1/jobs/${job1}`)
                .reply(200, testJobConfig(job1))
                .get(`/v1/jobs/${job2}`)
                .reply(200, testJobConfig(job2))
                .get(`/v1/jobs/${job3}`)
                .reply(200, testJobConfig(job3));

            const config = buildCLIConfig(
                'restart',
                {
                    'job-id': ['all'],
                    jobId: ['all'],
                    yes: true,
                    y: true,
                    status: ['failing']
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs.length).toBe(1);
            expect(job.jobs[0].status).toBe('failing');
        });

        it('should throw an error if no jobs match the status', async () => {
            const jobIds = makeJobIds(3);

            const [job1, job2, job3] = jobIds;

            const controllerResults = clusterControllers(jobIds);

            tsClient
                .get('/v1/cluster/controllers')
                .reply(200, () => Promise.resolve(controllerResults))
                .get(`/v1/jobs/${job1}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${job2}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${job3}/ex`)
                .reply(200, { _status: 'failing' })
                .get(`/v1/jobs/${job1}`)
                .reply(200, testJobConfig(job1))
                .get(`/v1/jobs/${job2}`)
                .reply(200, testJobConfig(job2))
                .get(`/v1/jobs/${job3}`)
                .reply(200, testJobConfig(job3));

            const config = buildCLIConfig(
                'restart',
                {
                    'job-id': ['all'],
                    jobId: ['all'],
                    yes: true,
                    y: true,
                    status: ['completed']
                }
            );

            const job = new Jobs(config);

            await expect(job.initialize()).rejects.toThrow();
        });
    });

    describe('stop', () => {
        it('should wait for job to stop', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .post(`/v1/jobs/${jobId}/_stop`)
                .reply(200, () => Promise.resolve({ status: 'stopping' }))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' });

            const config = buildCLIConfig('stop', { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            let { jobs } = job;

            expect(jobs[0].status).toBe('running');

            await job.stop();

            ({ jobs } = job);

            expect(jobs[0].status).toBe('stopped');
        });

        it('should not error out if job is already stopped', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId));

            const config = buildCLIConfig('stop', { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();
            await job.stop();

            const { jobs } = job;

            expect(jobs[0].status).toBe('stopped');
        });

        it('should throw error if job is already in terminal status and cannot be stopped', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'failed' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId));

            const config = buildCLIConfig('stop', { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('failed');

            await expect(job.stop()).rejects.toThrow();
        });

        it('should throw error if error on stop command', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .post(`/v1/jobs/${jobId}/_stop`)
                .reply(500, () => Promise.reject(new Error('bad stuff happened')))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve({ status: 'stopped' }));

            const config = buildCLIConfig('stop', { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('running');

            await expect(job.stop()).rejects.toThrow();
        });

        it('should throw error if error on await status command', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .post(`/v1/jobs/${jobId}/_stop`)
                .reply(200, () => Promise.resolve({ _status: 'stopping' }))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.reject(new Error('bad stuff happened')));

            const config = buildCLIConfig('stop', { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('running');

            await expect(job.stop()).rejects.toThrow();
        });
    });

    describe('start', () => {
        const action = 'start';
        it('should start a job', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .post(`/v1/jobs/${jobId}/_start`)
                .reply(200, () => Promise.resolve({ _status: 'initializing' }))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve({ _status: 'running' }));

            const config = buildCLIConfig(action, { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('stopped');

            await job.start();

            expect(job.jobs[0].status).toBe('running');
        });

        it('should not throw an error if job is already running', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId));

            const config = buildCLIConfig(action, { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('running');

            await job.start();

            expect(job.jobs[0].status).toBe('running');
        });

        it('should throw an error if job is not running or not in a terminal status', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'paused' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId));

            const config = buildCLIConfig(action, { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('paused');

            await expect(job.start()).rejects.toThrow();
        });

        it('should throw an error if start response returns an error', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .post(`/v1/jobs/${jobId}/_start`)
                .reply(500, () => Promise.reject(new Error('could not start job')));

            const config = buildCLIConfig(action, { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('stopped');

            await expect(job.start()).rejects.toThrow('could not start job');
        });

        it('should throw an error if await response returns an error', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .post(`/v1/jobs/${jobId}/_start`)
                .reply(200, () => Promise.resolve({ _status: 'initializing' }))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.reject(new Error('could not start job')));

            const config = buildCLIConfig(action, { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('stopped');

            await expect(job.start()).rejects.toThrow('could not start job');
        });

        it('should throw an error if await response is a terminal status', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .post(`/v1/jobs/${jobId}/_start`)
                .reply(200, () => Promise.resolve({ _status: 'initializing' }))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve({ _status: 'failed' }));

            const config = buildCLIConfig(action, { 'job-id': [jobId], jobId: [jobId] });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('stopped');

            await expect(job.start()).rejects.toThrow('Job cannot reach the target status, "running", because it is in the terminal state, "failed"');
        });
    });
});
