'use strict';

const fs = require('fs');
const misc = require('../../misc');
const wait = require('../../wait');
const { resetState } = require('../../helpers');

const { waitForJobStatus } = wait;

describe('assets', () => {
    beforeAll(() => resetState());

    const teraslice = misc.teraslice();

    /**
     * Uploads the specified asset file and then submits the specified job config
     * it then waits for the job to enter the running state, then waits for
     * the requested number of workers to enter the joined state.  Then that has
     * happened it tests to see that the number of workers joined is the number
     * of workers requested.  This reasoning is a bit circular, but a worker
     * won't enter the `joined` state if it fails to load its assets.
     *
     * @param {string}   jobSpecName the name of job to run
     * @param {string}   assetPath   the relative path to the asset file
     */
    async function submitAndValidateAssetJob(jobSpecName, assetPath) {
        const fileStream = fs.createReadStream(assetPath);
        const jobSpec = misc.newJob(jobSpecName);
        const { workers } = jobSpec; // save for comparison

        const result = await teraslice.assets.post(fileStream);
        // NOTE: In this case, the asset is referenced by the ID
        // assigned by teraslice and not it's name.
        jobSpec.assets = [result._id, 'elasticsearch'];

        const job = await teraslice.jobs.submit(jobSpec);

        await waitForJobStatus(job, 'running');
        const r = await wait.forWorkersJoined(job.id(), workers, 25);
        expect(r).toEqual(workers);
        return job.stop();
    }

    it('after uploading an asset, it can be deleted', async () => {
        const testStream = fs.createReadStream('test/fixtures/assets/example_asset_1.zip');

        const result = await teraslice.assets.post(testStream);

        // save the asset ID that was submitted to terslice
        const assetId = result._id;
        const response = await teraslice.assets.delete(assetId);

        // ensure the deleted asset's ID matches that of
        // the saved asset
        expect(assetId).toEqual(response._id);
    });

    // Test a bad asset
    // curl -XPOST -H "Content-Type: application/octet-stream"
    //   localhost:45678/assets --data-binary test/fixtures/assets/example_assets_1.zip
    // {"error":"asset.json was not found in root directory of asset bundle
    //    nor any immediate sub directory"}
    it('uploading a bad asset returns an error', async () => {
        const testStream = fs.createReadStream('test/fixtures/assets/example_bad_asset_1.zip');

        try {
            await teraslice.assets.post(testStream);
        } catch (err) {
            expect(err.message).toInclude('asset.json was not found');
            expect(err.code).toEqual(422);
        }
    });

    // Type 1 Asset - asset.json at top level of zipfile
    // example_assets/
    // example_assets/drop_property/
    // example_assets/drop_property/index.js
    // asset.json
    it('after starting a job with a Type 1 asset specified by ID should eventually have all workers joined', async () => {
        const assetPath = 'test/fixtures/assets/example_asset_1.zip';

        await submitAndValidateAssetJob('generator-asset', assetPath);
    });

    // Type 2 Asset - asset.json in subdirectory of zipfile
    // example_assets/
    // example_assets/asset.json
    // example_assets/drop_property/
    // example_assets/drop_property/index.js
    it('after starting a job with a Type 2 asset specified by ID should eventually have all workers joined', async () => {
        const assetPath = 'test/fixtures/assets/example_asset_2.zip';
        await submitAndValidateAssetJob('generator-asset', assetPath);
    });

    it('can update an asset bundle and use the new asset', async () => {
        const assetPath = 'test/fixtures/assets/example_asset_1updated.zip';

        const fileStream = fs.createReadStream(assetPath);
        // the asset on this job already points to 'ex1' so it should use the latest available asset
        const jobSpec = misc.newJob('generator-asset');
        const { workers } = jobSpec;

        const assetResponse = await teraslice.assets.post(fileStream);
        const assetId = assetResponse._id;

        const job = await teraslice.jobs.submit(jobSpec);
        await waitForJobStatus(job, 'running');

        const waitResponse = await wait.forWorkersJoined(job.id(), workers, 25);
        expect(waitResponse).toEqual(workers);

        const execution = await job.execution();
        expect(execution.assets[0]).toEqual(assetId);

        await job.stop();
    });

    it('can directly ask for the new asset to be used', async () => {
        const jobSpec = misc.newJob('generator-asset');
        jobSpec.assets = ['ex1:0.1.1', 'elasticsearch'];
        const { workers } = jobSpec;

        const assetResponse = await teraslice.assets.get('ex1/0.1.1');
        const assetId = assetResponse[0].id;

        const job = await teraslice.jobs.submit(jobSpec);
        await waitForJobStatus(job, 'running');

        const waitResponse = await wait.forWorkersJoined(job.id(), workers, 25);
        expect(waitResponse).toEqual(workers);

        const execution = await job.execution();
        expect(execution.assets[0]).toEqual(assetId);

        await job.stop();
    });
});
