'use strict';

const fs = require('fs');
const _ = require('lodash');
const misc = require('../../misc');
const { resetState } = require('../../helpers');

const { waitForJobStatus } = require('../../wait');

describe('api endpoint', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();
    it('submitted jobs are not saved in validated form', async () => {
        const assetPath = 'test/fixtures/assets/example_asset_1.zip';
        const testStream = fs.createReadStream(assetPath);
        const jobSpec = misc.newJob('generator-asset');

        await teraslice.assets.post(testStream);
        const job = await teraslice.jobs.submit(jobSpec, 'shouldNotStart');
        const jobConfig = await job.config();

        _.forOwn(jobSpec, (value, key) => {
            expect(jobConfig[key]).toEqual(value);
        });
    });

    it('should update job config', async () => {
        // NOTE that this relies on the asset loaded in the test above
        const jobSpec = misc.newJob('generator-asset');
        const { workers, slicers } = jobSpec;
        const alteredJob = _.cloneDeep(jobSpec);
        alteredJob.workers = 3;
        delete alteredJob.slicers;

        const job = await teraslice.jobs.submit(jobSpec, 'shouldNotStart');

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
        jobSpec.name = 'basic reindex for lifecycle';
        jobSpec.operations[1].index = 'test-reindex-10-lifecycle';

        async function didError(p) {
            try {
                await p;
                return true;
            } catch (err) {
                return false;
            }
        }

        const job = await teraslice.jobs.submit(jobSpec);
        const jobId = job.id();
        await waitForJobStatus(job, 'completed');
        const ex = await teraslice.cluster.get(`/jobs/${jobId}/ex`);
        const exId = ex.ex_id;

        const result = await Promise.all([
            didError(teraslice.cluster.post(`/jobs/${jobId}/_stop`)),
            didError(teraslice.cluster.post(`/jobs/${jobId}/_resume`)),
            didError(teraslice.cluster.post(`/jobs/${jobId}/_pause`)),
            didError(teraslice.cluster.post(`/ex/${exId}/_stop`)),
            didError(teraslice.cluster.post(`/ex/${exId}/_resume`)),
            didError(teraslice.cluster.post(`/ex/${exId}/_pause`)),
        ]);

        expect(result.every(v => v === true)).toBeTrue();
    });

    it('api end point /assets should return an array of json objects of asset metadata', async () => {
        const response = await teraslice.cluster.get('/assets');

        expect(_.isArray(response)).toBe(true);
        expect(_.isPlainObject(response[0])).toBe(true);
        expect(_.has(response[0], '_created')).toBe(true);
        expect(_.has(response[0], 'name')).toBe(true);
        expect(_.has(response[0], 'id')).toBe(true);
        expect(_.has(response[0], 'version')).toBe(true);
    });

    it('api end point /assets/assetName should return an array of json objects of asset metadata', async () => {
        const response = await teraslice.cluster.get('/assets/ex1');

        expect(_.isArray(response)).toBe(true);
        expect(_.isPlainObject(response[0])).toBe(true);
        expect(_.has(response[0], '_created')).toBe(true);
        expect(_.has(response[0], 'name')).toBe(true);
        expect(_.has(response[0], 'id')).toBe(true);
        expect(_.has(response[0], 'version')).toBe(true);
    });

    it('api end point /assets/assetName/version should return an array of json objects of asset metadata', async () => {
        const response = await teraslice.cluster.get('/assets/ex1/0.0.1');

        expect(response).toBeArray();
        expect(_.isPlainObject(response[0])).toBe(true);
        expect(_.has(response[0], '_created')).toBe(true);
        expect(_.has(response[0], 'name')).toBe(true);
        expect(_.has(response[0], 'id')).toBe(true);
        expect(_.has(response[0], 'version')).toBe(true);
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
