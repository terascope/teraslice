'use strict';

const fs = require('fs');
const misc = require('../../misc');
const wait = require('../../wait');
const { resetState } = require('../../helpers');

const { waitForJobStatus } = wait;

describe('Asset Tests', () => {
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
    function submitAndValidateAssetJob(jobSpecName, assetPath) {
        const fileStream = fs.createReadStream(assetPath);
        const jobSpec = misc.newJob(jobSpecName);
        const { workers } = jobSpec; // save for comparison

        return teraslice.assets.post(fileStream)
            .then((result) => {
                // NOTE: In this case, the asset is referenced by the ID
                // assigned by teraslice and not it's name.
                jobSpec.assets = [JSON.parse(result)._id];
                return teraslice.jobs.submit(jobSpec)
                    .then(job => waitForJobStatus(job, 'running')
                        .then(() => wait.forWorkersJoined(job.id(), workers, 20))
                        .then((r) => {
                            expect(r).toEqual(workers);
                            return job.stop();
                        }));
            });
    }
    it('After uploading an asset, it can be deleted', (done) => {
        const testStream = fs.createReadStream('test/fixtures/assets/example_asset_1.zip');

        teraslice.assets.post(testStream)
            .then((result) => {
                // save the asset ID that was submitted to terslice
                const assetId = JSON.parse(result)._id;
                return teraslice.assets.delete(assetId)
                    .then((response) => {
                        // ensure the deleted asset's ID matches that of
                        // the saved asset
                        expect(assetId).toEqual(JSON.parse(response).assetId);
                        // TODO: verify that this asset no longer
                        // appears in /txt/assets
                        return response;
                    });
            })
            .catch(fail)
            .finally(() => { done(); });
    });


    // Test a bad asset
    // curl -XPOST -H "Content-Type: application/octet-stream"
    //   localhost:45678/assets --data-binary test/fixtures/assets/example_assets_1.zip
    // {"error":"asset.json was not found in root directory of asset bundle
    //    nor any immediate sub directory"}
    it('Uploading a bad asset returns an error', (done) => {
        const testStream = fs.createReadStream('test/fixtures/assets/example_bad_asset_1.zip');

        teraslice.assets.post(testStream)
            .then(result => expect(JSON.parse(result).error).toMatch('asset.json was not found'))
            .catch(fail)
            .finally(() => { done(); });
    });


    // Type 1 Asset - asset.json at top level of zipfile
    // example_assets/
    // example_assets/drop_property/
    // example_assets/drop_property/index.js
    // asset.json
    it('After starting a job with a Type 1 asset specified by ID should eventually have all workers joined', (done) => {
        const assetPath = 'test/fixtures/assets/example_asset_1.zip';
        submitAndValidateAssetJob('generator-asset', assetPath)
            .catch(fail)
            .finally(() => { done(); });
    });

    // Type 2 Asset - asset.json in subdirectory of zipfile
    // example_assets/
    // example_assets/asset.json
    // example_assets/drop_property/
    // example_assets/drop_property/index.js
    it('After starting a job with a Type 2 asset specified by ID should eventually have all workers joined', (done) => {
        const assetPath = 'test/fixtures/assets/example_asset_2.zip';
        submitAndValidateAssetJob('generator-asset', assetPath)
            .catch(fail)
            .finally(() => { done(); });
    });

    it('can update an asset bundle and use the new asset', async () => {
        const assetPath = 'test/fixtures/assets/example_asset_1updated.zip';

        const fileStream = fs.createReadStream(assetPath);
        // the asset on this job already points to 'ex1' so it should use the latest available asset
        const jobSpec = misc.newJob('generator-asset');
        const { workers } = jobSpec;

        const assetResponse = await teraslice.assets.post(fileStream);
        const assetId = JSON.parse(assetResponse)._id;

        const job = await teraslice.jobs.submit(jobSpec);
        await waitForJobStatus(job, 'running');

        const waitResponse = await wait.forWorkersJoined(job.id(), workers, 20);
        expect(waitResponse).toEqual(workers);

        const execution = await job.execution();
        expect(execution.assets[0]).toEqual(assetId);

        await job.stop();
    });

    it('can directly ask for the new asset to be used', async () => {
        const jobSpec = misc.newJob('generator-asset');
        jobSpec.assets = ['ex1:0.1.1'];
        const { workers } = jobSpec;

        const assetResponse = await teraslice.assets.get('ex1/0.1.1');
        const assetId = assetResponse[0].id;

        const job = await teraslice.jobs.submit(jobSpec);
        await waitForJobStatus(job, 'running');

        const waitResponse = await wait.forWorkersJoined(job.id(), workers, 20);
        expect(waitResponse).toEqual(workers);

        const execution = await job.execution();
        expect(execution.assets[0]).toEqual(assetId);

        await job.stop();
    });
});
