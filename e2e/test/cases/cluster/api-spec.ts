import { createReadStream } from 'node:fs';
import { cloneDeep, pDelay } from '@terascope/core-utils';
import { JobConfig, TerasliceApiV2 } from '@terascope/types';
import { TerasliceHarness } from '../../teraslice-harness.js';
import { config } from '../../config.js';
import { baseConfig } from '../../setup-config.js';
import { Ex, Job } from 'teraslice-client-js';

const { TEST_PLATFORM, TEST_API_VERSION } = config;

describe('cluster api', () => {
    let terasliceHarness: TerasliceHarness;

    beforeAll(async () => {
        terasliceHarness = new TerasliceHarness();
        await terasliceHarness.init();
        await terasliceHarness.resetState();
    });

    it('submitted jobs are not saved in validated form', async () => {
        const assetPath = 'test/fixtures/assets/example_asset_1.zip';
        const testStream = createReadStream(assetPath);
        const jobSpec = terasliceHarness.newJob('generator-asset');
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.05;
        }
        await terasliceHarness.teraslice.assets.upload(testStream, {
            blocking: true
        });
        const job = await terasliceHarness.teraslice.jobs.submit(jobSpec, true);
        const jobConfig = await job.config();

        expect(jobConfig).toMatchObject(jobSpec);
    });

    it('should update job config', async () => {
        // NOTE that this relies on the asset loaded in the test above
        const jobSpec = terasliceHarness.newJob('generator-asset');
        const { workers, slicers } = jobSpec;
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.05;
        }
        const alteredJob: Partial<JobConfig> = cloneDeep(jobSpec);
        alteredJob.workers = 3;
        delete alteredJob.slicers;

        const job = await terasliceHarness.teraslice.jobs.submit(jobSpec, true);

        const jobId = job.id();

        let jobConfig = await job.config();

        expect(jobConfig.slicers).toEqual(slicers);
        expect(jobConfig.workers).toEqual(workers);

        await terasliceHarness.teraslice.cluster.put(`/jobs/${jobId}`, alteredJob);

        jobConfig = await job.config();

        expect(jobConfig.assets).toEqual(alteredJob.assets);
        expect(jobConfig.workers).toEqual(alteredJob.workers);
        expect(jobConfig.slicers).not.toBeDefined();
    });

    it('will not send lifecycle changes to executions that are not active', async () => {
        const jobSpec = terasliceHarness.newJob('reindex');
        const specIndex = terasliceHarness.newSpecIndex('api');
        jobSpec.name = 'basic reindex for lifecycle';
        // Set resource constraints on workers within CI
        if (TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.05;
        }

        jobSpec.apis[0].index = terasliceHarness.getExampleIndex(100);
        jobSpec.apis[1].index = specIndex;

        const job = await terasliceHarness.teraslice.jobs.submit(jobSpec);
        const jobId = job.id();

        const { ex_id: exId } = await job.execution();
        const ex = terasliceHarness.teraslice.executions.wrap(exId);

        await terasliceHarness.waitForExStatus(ex, 'completed', 100, 1000);
        await pDelay(100);

        const notActive = {
            statusCode: 404,
            message: expect.stringContaining(`no active execution context was found for ex_id: ${exId}`)
        };

        await Promise.all([
            expect(terasliceHarness.teraslice.cluster.post(`/jobs/${jobId}/_resume`)).rejects.toMatchObject(notActive),
            expect(terasliceHarness.teraslice.cluster.post(`/jobs/${jobId}/_pause`)).rejects.toMatchObject(notActive),
            expect(ex.resume()).rejects.toMatchObject(notActive),
            expect(ex.pause()).rejects.toMatchObject(notActive)
        ]);
    });

    it('api end point /assets should return an array of json objects of asset metadata', async () => {
        const response = await terasliceHarness.teraslice.assets.list();

        expect(response).toBeArray();
        expect(response[0]).toHaveProperty('_created');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('version');
    });

    it('api end point /assets/assetName should return an array of json objects of asset metadata', async () => {
        const response = await terasliceHarness.teraslice.assets.getAsset('ex1');

        expect(response).toBeArray();
        expect(response[0]).toHaveProperty('_created');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('version');
    });

    it('api end point /assets/assetName/version should return an array of json objects of asset metadata', async () => {
        const response = await terasliceHarness.teraslice.assets.getAsset('ex1', '0.0.1');

        expect(response).toBeArray();
        expect(response[0]).toHaveProperty('_created');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('version');
    });

    it('api end point /cluster/connectors should return the configured connectors', async () => {
        // derive the expected type:name pairs from the same config the cluster is deployed with
        const expectedPairs = Object.entries(baseConfig.terafoundation.connectors)
            .flatMap(([type, connections]) => Object.keys(connections).map((name) => `${type}:${name}`));

        const response = await terasliceHarness.teraslice.cluster.get('/cluster/connectors');

        expect(response).toHaveProperty('connectors');
        expect(response.connectors).toBeArray();
        response.connectors.forEach((connector: any) => {
            expect(connector).toHaveProperty('type');
            expect(connector).toHaveProperty('name');
        });

        const pairs = response.connectors.map((c: any) => `${c.type}:${c.name}`);
        expect(pairs.sort()).toEqual(expectedPairs.sort());
    });

    it('api end point /cluster/job-schema should return the generated job schema', async () => {
        const response = await terasliceHarness.teraslice.cluster.get('/cluster/job-schema');

        expect(response).toHaveProperty('version');
        expect(response).toHaveProperty('job_schema');

        const { job_schema: jobSchemaResponse } = response;
        expect(jobSchemaResponse.title).toEqual('Teraslice Job');
        expect(jobSchemaResponse.properties.lifecycle.enum).toEqual(['once', 'persistent']);
        expect(jobSchemaResponse.required).toContain('operations');
    });

    it('api end point /cluster/connectors?groupBy=type should return connectors grouped by type', async () => {
        const response = await terasliceHarness.teraslice.cluster.get('/cluster/connectors?groupBy=type');

        expect(response).toHaveProperty('connectors');
        Object.entries(baseConfig.terafoundation.connectors).forEach(([type, connections]) => {
            expect(response.connectors[type].sort()).toEqual(Object.keys(connections).sort());
        });
    });

    it('api end point /txt/assets should return a text table', async () => {
        const response = await terasliceHarness.teraslice.cluster.txt('assets');
        expect(response).toBeString();
    });

    it('api end point /txt/assets/assetName should return a text table', async () => {
        const response = await terasliceHarness.teraslice.cluster.txt('assets/ex1');
        expect(response).toBeString();
    });

    it('api end point /txt/assets/assetName/version should return a text table', async () => {
        const response = await terasliceHarness.teraslice.cluster.txt('assets/ex1/0.0.1');
        expect(response).toBeString();
    });

    describe('job active state', () => {
        it('should mark a job inactive, then active again', async () => {
            const jobSpec = terasliceHarness.newJob('generator');
            const job = await terasliceHarness.teraslice.jobs.submit(jobSpec, true);
            const jobId = job.id();

            await terasliceHarness.teraslice.cluster.post(`/jobs/${jobId}/_inactive`);
            expect(await job.config()).toMatchObject({ active: false });

            await terasliceHarness.teraslice.cluster.post(`/jobs/${jobId}/_active`);
            expect(await job.config()).toMatchObject({ active: true });
        });
    });

    describe('a running job', () => {
        // NOTE: every test in this section will use a single running job
        let job: Job;
        let jobId: string;
        let exId: string;

        beforeAll(async () => {
            const jobSpec = terasliceHarness.newJob('generator');
            // Set resource constraints on workers within CI
            if (TEST_PLATFORM === 'kubernetesV2') {
                jobSpec.resources_requests_cpu = 0.05;
            }

            job = await terasliceHarness.teraslice.jobs.submit(jobSpec);
            jobId = job.id();
            ({ ex_id: exId } = await job.execution());
            const ex = terasliceHarness.teraslice.executions.wrap(exId);
            await terasliceHarness.waitForExStatus(ex, 'running', 100, 1000);
        });

        afterAll(async () => {
            await job.stop({ blocking: true });
        });

        // the tap route is passed through without a response check on the
        // server, so this is the only test of the shape a real worker sends
        it('GET /jobs/<jobId>/tap should return the records each operation produced, matching SliceTapResultSchema', async () => {
            const result = await job.tap({ size: '5' });

            const { records } = TerasliceApiV2.SliceTapResultSchema.parse(result);

            // one entry per operation: data_generator, then noop
            expect(records).toBeArrayOfSize(2);
            records.forEach((opRecords) => {
                expect(opRecords).toBeArrayOfSize(5);
            });
            // noop passes the generated records through unchanged
            expect(records[1]).toEqual(records[0]);
        });

        it('POST /jobs/<jobId>/_settings should change the log level of the execution', async () => {
            await expect(terasliceHarness.teraslice.cluster.post(`/jobs/${jobId}/_settings`, null, {
                searchParams: { log_level: 'debug' }
            })).resolves.toEqual({ exId, level: 'debug' });

            await terasliceHarness.teraslice.cluster.post(`/jobs/${jobId}/_settings`, null, {
                searchParams: { log_level: 'info' }
            });
        });

        it('should return the execution controller of the job', async () => {
            // slicer() calls /jobs/<jobId>/slicer on v1 and /jobs/<jobId>/controller on v2
            const controllers = await job.slicer();

            expect(controllers).toBeArrayOfSize(1);
            expect(controllers[0]).toMatchObject({ ex_id: exId, job_id: jobId });
        });

        it('GET /cluster/controllers should include the execution controller of the job', async () => {
            const controllers = await terasliceHarness.teraslice.cluster.controllers();

            expect(controllers).toEqual(
                expect.arrayContaining([expect.objectContaining({ ex_id: exId, job_id: jobId })])
            );
        });

        it('GET /jobs/<jobId>/errors should return no errors for a job with no failed slices', async () => {
            await expect(job.errors()).resolves.toEqual([]);
        });

        // TODO: Teraslice v4 deletes /v1, run these unconditionally
        // https://github.com/terascope/teraslice/issues/4584#issuecomment-6636093239
        (TEST_API_VERSION === 'v2' ? describe : describe.skip)('v2 only', () => {
            it('should reject an unknown query param with a 400', async () => {
                await expect(job.config({ nope: 'true' } as any)).rejects.toMatchObject({
                    statusCode: 400,
                    message: expect.stringContaining('Unrecognized key: "nope"')
                });
            });

            it('should respond with a 405 for a v1 route that was removed in v2', async () => {
                await expect(terasliceHarness.teraslice.cluster.post(`/ex/${exId}/_stop`))
                    .rejects.toMatchObject({ statusCode: 405 });

                // and the job is still running
                await expect(job.status()).resolves.toEqual('running');
            });

            it('should not recover an execution that belongs to another job', async () => {
                const otherJob = await terasliceHarness.teraslice.jobs.submit(
                    terasliceHarness.newJob('generator'), true
                );
                const otherJobId = otherJob.id();

                await expect(terasliceHarness.teraslice.cluster.post(`/jobs/${otherJobId}/_recover`, null, {
                    searchParams: { ex_id: exId }
                })).rejects.toMatchObject({
                    statusCode: 400,
                    message: expect.stringContaining(`Execution ${exId} does not belong to job ${otherJobId}`)
                });
            });
        });
    });

    describe('DELETE /jobs/<jobId>', () => {
        // NOTE: every test in this section will use a single job

        const deletedJobProperties = {
            _deleted: true,
            _deleted_on: expect.anything(),
            active: false
        };

        let job: Job;
        let jobId: string;
        let ex: Ex;
        let jobSpec: JobConfig;

        beforeAll(async () => {
            jobSpec = terasliceHarness.newJob('generator');
            // Set resource constraints on workers within CI
            if (TEST_PLATFORM === 'kubernetesV2') {
                jobSpec.resources_requests_cpu = 0.05;
            }

            job = await terasliceHarness.teraslice.jobs.submit(jobSpec, false);
            jobId = job.id();
            const { ex_id: exId } = await job.execution();
            ex = terasliceHarness.teraslice.executions.wrap(exId);
        });

        it('will not delete a running job', async () => {
            await terasliceHarness.waitForExStatus(ex, 'running', 100, 1000);

            await expect(terasliceHarness.teraslice.jobs.delete(`/jobs/${jobId}`)).rejects.toThrow();
        });

        it('will delete a stopped job', async () => {
            await terasliceHarness.teraslice.jobs.post(`/jobs/${jobId}/_stop`);
            await terasliceHarness.waitForExStatus(ex, 'stopped', 100, 1000);

            await expect(terasliceHarness.teraslice.jobs.delete(`/jobs/${jobId}`)).resolves.toMatchObject(deletedJobProperties);
        });

        it('will not list a deleted job by default', async () => {
            const list = await terasliceHarness.teraslice.jobs.list();
            const jobIds = list.map((jobConfig) => jobConfig.job_id);
            expect(jobIds).not.toContain(jobId);
        });

        it('will list a deleted job when passed "{ deleted: true }"', async () => {
            const list = await terasliceHarness.teraslice.jobs.list({ deleted: true });
            expect(list).toEqual(
                expect.arrayContaining([expect.objectContaining({ ...jobSpec, job_id: jobId })])
            );
        });

        it('will not start a deleted job', async () => {
            await expect(terasliceHarness.teraslice.jobs.post(`/jobs/${jobId}/_start`)).rejects.toThrow(`Job ${jobId} has been deleted and cannot be started.`);
        });

        it('will not update a deleted job', async () => {
            await expect(terasliceHarness.teraslice.jobs.put(`/jobs/${jobId}`, { ...jobSpec, workers: 1 })).rejects.toThrow(`Job ${jobId} has been deleted and cannot be updated.`);
        });

        it('will not recover a deleted job', async () => {
            await expect(terasliceHarness.teraslice.jobs.post(`/jobs/${jobId}/_recover`)).rejects.toThrow(`Job ${jobId} has been deleted and cannot be recovered.`);
        });
    });
});
