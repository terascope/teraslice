'use strict';

const fs = require('fs');
const misc = require('../../misc')();
const wait = require('../../wait')();


module.exports = function simpleAssetTest() {
    const teraslice = misc.teraslice();

    /**
     * Uploads the specified asset file and then submits the specified job spec
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
                    .then(job =>
                        job.waitForStatus('running')
                            .then(() => wait.forWorkersJoined(job.id(), workers, 20))
                            .then((r) => {
                                expect(r).toEqual(workers);
                                return job.stop();
                            }));
            });
    }

    describe('Asset Tests', () => {
        it('After uploading an asset, it can be deleted', (done) => {
            const testStream = fs.createReadStream('spec/fixtures/assets/example_asset_1.zip');

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
                .finally(done);
        });


        // Test a bad asset
        // curl -XPOST -H "Content-Type: application/octet-stream"
        //   localhost:45678/assets --data-binary spec/fixtures/assets/example_assets_1.zip
        // {"error":"asset.json was not found in root directory of asset bundle
        //    nor any immediate sub directory"}
        it('Uploading a bad asset returns an error', (done) => {
            const testStream = fs.createReadStream('spec/fixtures/assets/example_bad_asset_1.zip');

            teraslice.assets.post(testStream)
                .then(result => expect(JSON.parse(result).error).toMatch('asset.json was not found'))
                .catch(fail)
                .finally(done);
        });


        // Type 1 Asset - asset.json at top level of zipfile
        // example_assets/
        // example_assets/drop_property/
        // example_assets/drop_property/index.js
        // asset.json
        it('After starting a job with a Type 1 asset specified by ID should eventually have all workers joined', (done) => {
            const assetPath = 'spec/fixtures/assets/example_asset_1.zip';
            submitAndValidateAssetJob('generator-asset', assetPath)
                .catch(fail)
                .finally(done);
        });

        // Type 2 Asset - asset.json in subdirectory of zipfile
        // example_assets/
        // example_assets/asset.json
        // example_assets/drop_property/
        // example_assets/drop_property/index.js
        it('After starting a job with a Type 2 asset specified by ID should eventually have all workers joined', (done) => {
            const assetPath = 'spec/fixtures/assets/example_asset_2.zip';
            submitAndValidateAssetJob('generator-asset', assetPath)
                .catch(fail)
                .finally(done);
        });
    });
};
