import { createReadStream } from 'node:fs';
import { cloneDeep, pDelay } from '@terascope/utils';
import { JobConfig } from '@terascope/types';
import { TerasliceHarness } from '../../teraslice-harness.js';
import { TEST_PLATFORM } from '../../config.js';

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
        if (TEST_PLATFORM === 'kubernetes' || TEST_PLATFORM === 'kubernetesV2') {
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
        if (TEST_PLATFORM === 'kubernetes' || TEST_PLATFORM === 'kubernetesV2') {
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
        if (TEST_PLATFORM === 'kubernetes' || TEST_PLATFORM === 'kubernetesV2') {
            jobSpec.resources_requests_cpu = 0.05;
        }

        if (!jobSpec.operations) {
            jobSpec.operations = [];
        }

        jobSpec.operations[0].index = terasliceHarness.getExampleIndex(100);
        jobSpec.operations[1].index = specIndex;

        async function didError(p: Promise<void>) {
            try {
                await p;
                return false;
            } catch (err) {
                return true;
            }
        }

        const job = await terasliceHarness.teraslice.jobs.submit(jobSpec);
        const jobId = job.id();

        const { ex_id: exId } = await job.execution();
        const ex = terasliceHarness.teraslice.executions.wrap(exId);

        await terasliceHarness.waitForExStatus(ex, 'completed', 100, 1000);
        await pDelay(100);

        const result = await Promise.all([
            didError(terasliceHarness.teraslice.cluster.post(`/jobs/${jobId}/_resume`)),
            didError(terasliceHarness.teraslice.cluster.post(`/jobs/${jobId}/_pause`)),
            didError(terasliceHarness.teraslice.cluster.post(`/ex/${exId}/_resume`)),
            didError(terasliceHarness.teraslice.cluster.post(`/ex/${exId}/_pause`))
        ]);

        expect(result).toEqual([true, true, true, true]);
    });

    it('api end point /assets should return an array of json objects of asset metadata', async () => {
        const response = await terasliceHarness.teraslice.cluster.get('/assets');

        expect(response).toBeArray();
        expect(response[0]).toHaveProperty('_created');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('version');
    });

    it('api end point /assets/assetName should return an array of json objects of asset metadata', async () => {
        const response = await terasliceHarness.teraslice.cluster.get('/assets/ex1');

        expect(response).toBeArray();
        expect(response[0]).toHaveProperty('_created');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('version');
    });

    it('api end point /assets/assetName/version should return an array of json objects of asset metadata', async () => {
        const response = await terasliceHarness.teraslice.cluster.get('/assets/ex1/0.0.1');

        expect(response).toBeArray();
        expect(response[0]).toHaveProperty('_created');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('version');
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
});
