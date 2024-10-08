import { jest } from '@jest/globals';
import nock from 'nock';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import Jobs from '../../src/helpers/jobs.js';
import {
    makeJobIds,
    testJobConfig,
    buildCLIConfig,
    clusterControllers,
    getJobExecution
} from './helpers.js';
import reply from '../../src/helpers/reply.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

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

        it('should add multiple job metadata to jobs property', async () => {
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

        it('should not throw error if job is already in terminal status', async () => {
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

            await expect(job.stop()).resolves.toBeUndefined();
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

            await expect(job.start()).rejects.toThrow('Job cannot reach the target status, "running,completed", because it is in the terminal state, "failed"');
        });

        it('should check workers and slice failures if watch flag is provided', async () => {
            const [jobId] = makeJobIds(1);
            const jobController = clusterControllers([jobId]);
            const jobConfig = testJobConfig(jobId);

            jobConfig.workers = 10;
            jobController[0].workers_active = 3;
            jobController[0].workers_available = 7;
            jobController[0].processed = 100;

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, jobConfig)
                .post(`/v1/jobs/${jobId}/_start`)
                .reply(200, () => Promise.resolve({ _status: 'initializing' }))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve({ _status: 'running' }))
                .get(`/v1/jobs/${jobId}/controller`)
                .reply(200, () => Promise.resolve(jobController));

            const config = buildCLIConfig(action, {
                'job-id': [jobId],
                jobId: [jobId],
                watch: 50,
                interval: 1000,
                timeout: 5000
            });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('stopped');

            await job.start();

            expect(job.jobs[0].status).toBe('running');
        });

        it('should pass job even if worker count is not exact but close enough', async () => {
            const [jobId] = makeJobIds(1);
            const jobController = clusterControllers([jobId]);
            const jobConfig = testJobConfig(jobId);

            jobConfig.workers = 45;
            jobController[0].workers_active = 38;
            jobController[0].workers_available = 9;
            jobController[0].processed = 100;

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, jobConfig)
                .post(`/v1/jobs/${jobId}/_start`)
                .reply(200, () => Promise.resolve({ _status: 'initializing' }))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve({ _status: 'running' }))
                .get(`/v1/jobs/${jobId}/controller`)
                .reply(200, () => Promise.resolve(jobController));

            const config = buildCLIConfig(action, {
                'job-id': [jobId],
                jobId: [jobId],
                watch: 50,
                interval: 1000,
                timeout: 5000
            });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('stopped');

            await job.start();

            expect(job.jobs[0].status).toBe('running');
        });

        it('should throw an error if less then requested workers', async () => {
            const [jobId] = makeJobIds(1);
            const jobController = clusterControllers([jobId]);
            const jobConfig = testJobConfig(jobId);

            jobConfig.workers = 10;
            jobController[0].workers_active = 3;
            jobController[0].workers_available = 0;
            jobController[0].processed = 100;

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, jobConfig)
                .post(`/v1/jobs/${jobId}/_start`)
                .reply(200, () => Promise.resolve({ _status: 'initializing' }))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve({ _status: 'running' }))
                .get(`/v1/jobs/${jobId}/controller`)
                .reply(200, () => Promise.resolve(jobController));

            const config = buildCLIConfig(action, {
                'job-id': [jobId],
                jobId: [jobId],
                watch: 50,
                interval: 1000,
                timeout: 5000
            });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('stopped');

            await expect(job.start()).rejects.toThrow();
        });

        it('should throw an error if failed slices', async () => {
            const [jobId] = makeJobIds(1);
            const jobController = clusterControllers([jobId]);
            const jobConfig = testJobConfig(jobId);

            jobConfig.workers = 10;
            jobController[0].workers_active = 3;
            jobController[0].workers_available = 7;
            jobController[0].processed = 100;
            jobController[0].failed = 100;

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, jobConfig)
                .post(`/v1/jobs/${jobId}/_start`)
                .reply(200, () => Promise.resolve({ _status: 'initializing' }))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve({ _status: 'running' }))
                .get(`/v1/jobs/${jobId}/controller`)
                .reply(200, () => Promise.resolve(jobController));

            const config = buildCLIConfig(action, {
                'job-id': [jobId],
                jobId: [jobId],
                watch: 50,
                interval: 1000,
                timeout: 5000
            });

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('stopped');

            await expect(job.start()).rejects.toThrow();
        });

        it('should start a job based on locally saved state file', async () => {
            const localStatePath = path.join(dirname, '..', 'fixtures', 'job_saves', 'job_state_files', 'testerTest.json');

            const [jobId] = makeJobIds(1);

            const jobController = clusterControllers([jobId]);
            const jobExecution = getJobExecution(jobId);

            fs.writeJsonSync(
                localStatePath,
                { [jobId]: { controller: jobController, execution: jobExecution } },
                { spaces: 2 }
            );

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .post(`/v1/jobs/${jobId}/_start`)
                .reply(200, () => Promise.resolve({ _status: 'initializing' }))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve({ _status: 'running' }));

            const config = buildCLIConfig(
                action,
                {
                    'job-id': ['all'],
                    jobId: ['all'],
                    yes: true,
                    y: true,
                    interval: 1000,
                    timeout: 5000
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('stopped');

            await job.start();

            expect(job.jobs[0].status).toBe('running');
        });

        it('should batch jobs by worker count before starting jobs', () => {
            const jobIds = makeJobIds(5);

            const jobs = jobIds.map((id) => ({ config: testJobConfig(id), id }));

            jobs[0].config.workers = 12;
            jobs[1].config.workers = 22;
            jobs[2].config.workers = 10;
            jobs[3].config.workers = 120;
            jobs[4].config.workers = 14;

            const config = buildCLIConfig(
                action,
                {
                    'job-id': ['all'],
                    jobId: ['all'],
                    yes: true,
                    y: true,
                    interval: 1000,
                    timeout: 5000
                }
            );

            const job = new Jobs(config);

            job.jobs = jobs as any;

            const batched = job.batchJobsBeforeStart();

            expect(batched[0].length).toBe(3);
            expect(batched[1].length).toBe(1);
            expect(batched[2].length).toBe(1);
        });
    });

    describe('save', () => {
        const action = 'save';

        const localStatePath = path.join(dirname, '..', 'fixtures', 'job_saves');

        afterAll(async () => {
            await fs.remove(path.join(localStatePath, 'job_state_files'));
        });

        it('should save the job state for a single job', async () => {
            const [jobId] = makeJobIds(1);

            const jobController = clusterControllers([jobId]);
            const jobExecution = getJobExecution(jobId);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .get(`/v1/jobs/${jobId}/controller`)
                .reply(200, () => Promise.resolve(jobController))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve(jobExecution));

            const alias = 'save_jobs1';

            const config = buildCLIConfig(
                action,
                {
                    'job-id': [jobId],
                    jobId: [jobId],
                    configDir: localStatePath,
                    d: localStatePath,
                    clusterAlias: alias
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            await job.save();

            const state = fs.readJsonSync(path.join(localStatePath, 'job_state_files', `${alias}.json`));

            expect(state[jobId].execution.job_id).toBe(jobId);
            expect(state[jobId].controller.job_id).toBe(jobId);
        });

        it('should save the job state all running jobs on a cluster', async () => {
            const jobIds = makeJobIds(3);
            const jobControllers = clusterControllers(jobIds);

            const [job1, job2, job3] = jobIds;
            const [jobC1, jobC2, jobC3] = jobControllers;

            const jobEx1 = getJobExecution(job1);
            const jobEx2 = getJobExecution(job2);
            const jobEx3 = getJobExecution(job3);

            tsClient
                .get('/v1/cluster/controllers')
                .reply(200, () => Promise.resolve(jobControllers))
                .get(`/v1/jobs/${job1}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${job2}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${job3}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${job1}`)
                .reply(200, testJobConfig(job1))
                .get(`/v1/jobs/${job2}`)
                .reply(200, testJobConfig(job2))
                .get(`/v1/jobs/${job3}`)
                .reply(200, testJobConfig(job3))
                .get(`/v1/jobs/${job1}/controller`)
                .reply(200, () => Promise.resolve([jobC1]))
                .get(`/v1/jobs/${job1}/ex`)
                .reply(200, () => Promise.resolve(jobEx1))
                .get(`/v1/jobs/${job2}/controller`)
                .reply(200, () => Promise.resolve([jobC2]))
                .get(`/v1/jobs/${job2}/ex`)
                .reply(200, () => Promise.resolve(jobEx2))
                .get(`/v1/jobs/${job3}/controller`)
                .reply(200, () => Promise.resolve([jobC3]))
                .get(`/v1/jobs/${job3}/ex`)
                .reply(200, () => Promise.resolve(jobEx3));

            const alias = 'save_jobs2';

            const config = buildCLIConfig(
                action,
                {
                    'job-id': ['all'],
                    jobId: ['all'],
                    configDir: localStatePath,
                    d: localStatePath,
                    clusterAlias: alias,
                    yes: true,
                    y: true
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            await job.save();

            const state = fs.readJsonSync(path.join(localStatePath, 'job_state_files', `${alias}.json`));

            expect(state[job1].execution.job_id).toBe(job1);
            expect(state[job1].controller.job_id).toBe(job1);
            expect(state[job2].execution.job_id).toBe(job2);
            expect(state[job2].controller.job_id).toBe(job2);
            expect(state[job3].execution.job_id).toBe(job3);
            expect(state[job3].controller.job_id).toBe(job3);
        });
    });

    describe('jobs.adjustWorkers should', () => {
        let msg: any;
        let jobs: any;
        const id = '12341234';
        const exId = '56785678';

        const cliArgs = {
            'cluster-manager-type': 'native',
            'output-style': 'txt',
            'config-dir': path.join(dirname, '../fixtures/config_dir'),
            'cluster-alias': 'localhost',
            args: {}
        };

        beforeEach(() => {
            cliArgs.args = {};
        });

        afterEach(() => {
            jobs = {};
            nock.cleanAll();
        });

        it('return handle response if ts-client response is an object', async () => {
            cliArgs.args = { id, action: 'add', number: 5 };

            jobs = new Jobs(cliArgs);

            msg = { message: `5 workers have been added for execution: ${exId}` };

            tsClient
                .post(`/v1/jobs/${id}/_workers?add=5`)
                .reply(200, msg);

            await expect(jobs.adjustWorkers()).toResolve();
        });

        it('return handle response if ts-client response is a string', async () => {
            cliArgs.args = { id, action: 'remove', number: 3 };

            jobs = new Jobs(cliArgs);

            msg = `3 workers have been removed for execution: ${exId}`;

            tsClient
                .post(`/v1/jobs/${id}/_workers?remove=3`)
                .reply(200, msg);

            await expect(jobs.adjustWorkers()).toResolve();
        });
    });

    describe('jobs', () => {
        const id = '12341234';

        const cliArgs = {
            'cluster-manager-type': 'native',
            'output-style': 'txt',
            'config-dir': path.join(dirname, '../fixtures/config_dir'),
            'cluster-alias': 'localhost',
            args: {}
        };

        it('should return a job object', () => {
            const number = 5;
            const action = 'add';

            cliArgs.args = { id, action, number };

            const jobs = new Jobs(cliArgs);
            expect(jobs).toBeDefined();
        });
    });

    describe('delete', () => {
        const action = 'delete';
        it('should delete a stopped job', async () => {
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'stopped' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .delete(`/v1/jobs/${jobId}`)
                .reply(200, () => Promise.resolve({ _deleted: 'true' }));

            const config = buildCLIConfig(
                action,
                {
                    'job-id': [jobId],
                    jobId: [jobId],
                    yes: true,
                    y: true
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('stopped');

            await expect(job.delete()).resolves.toBeUndefined();
        });

        it('should log an error if job is not in a terminal status', async () => {
            reply.error = jest.fn();
            const [jobId] = makeJobIds(1);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId));

            const config = buildCLIConfig(
                action,
                {
                    'job-id': [jobId],
                    jobId: [jobId],
                    yes: true,
                    y: true
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            expect(job.jobs[0].status).toBe('running');

            await expect(job.delete()).resolves.toBe(undefined);
            expect(reply.error).toHaveBeenCalledWith(expect.stringContaining('Job is in non-terminal status running, cannot delete. Skipping'));
        });
    });

    describe('export', () => {
        const action = 'export';

        const exportPath = path.join(dirname, '..', 'fixtures', 'job_exports');

        beforeEach(() => {
            fs.mkdirSync(exportPath);
        });

        afterEach(async () => {
            fs.removeSync(exportPath);
        });

        it('should export a job to the default directory', async () => {
            const [jobId] = makeJobIds(1);

            const jobController = clusterControllers([jobId]);
            const jobExecution = getJobExecution(jobId);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .get(`/v1/jobs/${jobId}/controller`)
                .reply(200, () => Promise.resolve(jobController))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve(jobExecution));

            const alias = 'export_jobs1';

            const config = buildCLIConfig(
                action,
                {
                    'job-id': [jobId],
                    jobId: [jobId],
                    clusterAlias: alias
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            const originalDirectory = process.cwd();
            fs.mkdirSync(path.join(exportPath, 'current'));
            process.chdir(path.join(exportPath, 'current'));

            await job.export();

            const jobFile = fs.readJsonSync(path.join(process.cwd(), 'test-job.json'));

            expect(jobFile.__metadata.cli.job_id).toBe(jobId);
            process.chdir(originalDirectory);
        });

        it('should export a job to a custom directory', async () => {
            const customDir = path.join(exportPath, 'custom1');
            const [jobId] = makeJobIds(1);

            const jobController = clusterControllers([jobId]);
            const jobExecution = getJobExecution(jobId);

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, testJobConfig(jobId))
                .get(`/v1/jobs/${jobId}/controller`)
                .reply(200, () => Promise.resolve(jobController))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve(jobExecution));

            const alias = 'export_jobs1';

            const config = buildCLIConfig(
                action,
                {
                    'job-id': [jobId],
                    jobId: [jobId],
                    clusterAlias: alias,
                    outdir: customDir
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            await job.export();

            const jobFile = fs.readJsonSync(path.join(customDir, 'test-job.json'));

            expect(jobFile.__metadata.cli.job_id).toBe(jobId);
        });

        it('should export all jobs to a custom directory', async () => {
            const customDir = path.join(exportPath, 'custom2');

            const jobIds = makeJobIds(3);
            const [job1, job2, job3] = jobIds;
            const jobsList = [{ job_id: job1 }, { job_id: job2 }, { job_id: job3 }];
            const jobControllers = clusterControllers(jobIds);

            const [jobC1, jobC2, jobC3] = jobControllers;

            const jobEx1 = getJobExecution(job1);
            const jobEx2 = getJobExecution(job2);
            const jobEx3 = getJobExecution(job3);

            tsClient
                .get('/v1/jobs')
                .reply(200, () => Promise.resolve(jobsList))
                .get(`/v1/jobs/${job1}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${job2}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${job3}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${job1}`)
                .reply(200, testJobConfig(job1))
                .get(`/v1/jobs/${job2}`)
                .reply(200, testJobConfig(job2))
                .get(`/v1/jobs/${job3}`)
                .reply(200, testJobConfig(job3))
                .get(`/v1/jobs/${job1}/controller`)
                .reply(200, () => Promise.resolve([jobC1]))
                .get(`/v1/jobs/${job1}/ex`)
                .reply(200, () => Promise.resolve(jobEx1))
                .get(`/v1/jobs/${job2}/controller`)
                .reply(200, () => Promise.resolve([jobC2]))
                .get(`/v1/jobs/${job2}/ex`)
                .reply(200, () => Promise.resolve(jobEx2))
                .get(`/v1/jobs/${job3}/controller`)
                .reply(200, () => Promise.resolve([jobC3]))
                .get(`/v1/jobs/${job3}/ex`)
                .reply(200, () => Promise.resolve(jobEx3));

            const alias = 'export_jobs1';

            const config = buildCLIConfig(
                action,
                {
                    'job-id': ['all'],
                    jobId: ['all'],
                    clusterAlias: alias,
                    outdir: customDir,
                    yes: true,
                    y: true
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            await job.export();

            // Since all 3 jobs have the same file name, and exportOne() is called concurrently on
            // each job, 2 of the jobs may have to call createUniqueFilePath() a second or
            // third time. This race condition means there is no order to the file names.
            const jobFiles = [];
            jobFiles.push(fs.readJsonSync(path.join(customDir, 'test-job.json')));
            jobFiles.push(fs.readJsonSync(path.join(customDir, 'test-job-1.json')));
            jobFiles.push(fs.readJsonSync(path.join(customDir, 'test-job-2.json')));

            expect(jobFiles).toEqual(expect.arrayContaining([
                expect.objectContaining(
                    { __metadata: { cli: expect.objectContaining({ job_id: job1 }) } }
                ),
                expect.objectContaining(
                    { __metadata: { cli: expect.objectContaining({ job_id: job2 }) } }
                ),
                expect.objectContaining(
                    { __metadata: { cli: expect.objectContaining({ job_id: job3 }) } }
                )
            ]));
        });

        it('should create a file name with underscores replacing spaces', async () => {
            const [jobId] = makeJobIds(1);

            const jobController = clusterControllers([jobId]);
            const jobExecution = getJobExecution(jobId);

            jobController[0].name = 'test job';
            jobExecution.name = 'test job';

            tsClient
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, { _status: 'running' })
                .get(`/v1/jobs/${jobId}`)
                .reply(200, Object.assign({}, testJobConfig(jobId), { name: 'test job' }))
                .get(`/v1/jobs/${jobId}/controller`)
                .reply(200, () => Promise.resolve(jobController))
                .get(`/v1/jobs/${jobId}/ex`)
                .reply(200, () => Promise.resolve(jobExecution));

            const alias = 'export_jobs1';

            const config = buildCLIConfig(
                action,
                {
                    'job-id': [jobId],
                    jobId: [jobId],
                    clusterAlias: alias
                }
            );

            const job = new Jobs(config);

            await job.initialize();

            const originalDirectory = process.cwd();
            fs.mkdirSync(path.join(exportPath, 'current'));
            process.chdir(path.join(exportPath, 'current'));

            await job.export();

            const jobFile = fs.readJsonSync(path.join(process.cwd(), 'test_job.json'));

            expect(jobFile.__metadata.cli.job_id).toBe(jobId);
            process.chdir(originalDirectory);
        });
    });
});
