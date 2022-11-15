import fs from 'fs';
import { cloneDeep } from '@terascope/utils';
import misc from '../../misc.js';
import { resetState } from '../../helpers.js';
import { waitForExStatus } from '../../wait.js';

describe('cluster api', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();

    it('submitted jobs are not saved in validated form', async () => {
        const assetPath = 'test/fixtures/assets/example_asset_1.zip';
        const testStream = fs.createReadStream(assetPath);
        const jobSpec = misc.newJob('generator-asset');

        await teraslice.assets.upload(testStream, {
            blocking: true
        });
        const job = await teraslice.jobs.submit(jobSpec, true);
        const jobConfig = await job.config();

        expect(jobConfig).toMatchObject(jobSpec);
    });

    it('should update job config', async () => {
        // NOTE that this relies on the asset loaded in the test above
        const jobSpec = misc.newJob('generator-asset');
        const { workers, slicers } = jobSpec;
        const alteredJob = cloneDeep(jobSpec);
        alteredJob.workers = 3;
        delete alteredJob.slicers;

        const job = await teraslice.jobs.submit(jobSpec, true);

        const jobId = job.id();

        let jobConfig = await job.config();

        expect(jobConfig.slicers).toEqual(slicers);
        expect(jobConfig.workers).toEqual(workers);

        await teraslice.cluster.put(`/jobs/${jobId}`, alteredJob);

        jobConfig = await job.config();

        expect(jobConfig.assets).toEqual(alteredJob.assets);
        expect(jobConfig.workers).toEqual(alteredJob.workers);
        expect(jobConfig.slicers).not.toBeDefined();
    });

    it('will not send lifecycle changes to executions that are not active', async () => {
        const jobSpec = misc.newJob('reindex');
        const specIndex = misc.newSpecIndex('api');
        jobSpec.name = 'basic reindex for lifecycle';
        jobSpec.operations[0].index = misc.getExampleIndex(100);
        jobSpec.operations[1].index = specIndex;

        async function didError(p) {
            try {
                await p;
                return false;
            } catch (err) {
                return true;
            }
        }

        const job = await teraslice.jobs.submit(jobSpec);
        const jobId = job.id();

        const { ex_id: exId } = await job.execution();
        const ex = teraslice.executions.wrap(exId);

        await waitForExStatus(ex, 'completed', 100, 1000);

        const result = await Promise.all([
            didError(teraslice.cluster.post(`/jobs/${jobId}/_stop`)),
            didError(teraslice.cluster.post(`/jobs/${jobId}/_resume`)),
            didError(teraslice.cluster.post(`/jobs/${jobId}/_pause`)),
            didError(teraslice.cluster.post(`/ex/${exId}/_stop`)),
            didError(teraslice.cluster.post(`/ex/${exId}/_resume`)),
            didError(teraslice.cluster.post(`/ex/${exId}/_pause`))
        ]);

        expect(result).toEqual([true, true, true, true, true, true]);
    });

    it('api end point /assets should return an array of json objects of asset metadata', async () => {
        const response = await teraslice.cluster.get('/assets');

        expect(response).toBeArray();
        expect(response[0]).toHaveProperty('_created');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('version');
    });

    it('api end point /assets/assetName should return an array of json objects of asset metadata', async () => {
        const response = await teraslice.cluster.get('/assets/ex1');

        expect(response).toBeArray();
        expect(response[0]).toHaveProperty('_created');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('version');
    });

    it('api end point /assets/assetName/version should return an array of json objects of asset metadata', async () => {
        const response = await teraslice.cluster.get('/assets/ex1/0.0.1');

        expect(response).toBeArray();
        expect(response[0]).toHaveProperty('_created');
        expect(response[0]).toHaveProperty('name');
        expect(response[0]).toHaveProperty('id');
        expect(response[0]).toHaveProperty('version');
    });

    it('api end point /txt/assets should return a text table', async () => {
        const response = await teraslice.cluster.txt('assets');
        expect(response).toBeString();
    });

    it('api end point /txt/assets/assetName should return a text table', async () => {
        const response = await teraslice.cluster.txt('assets/ex1');
        expect(response).toBeString();
    });

    it('api end point /txt/assets/assetName/version should return a text table', async () => {
        const response = await teraslice.cluster.txt('assets/ex1/0.0.1');
        expect(response).toBeString();
    });
});
