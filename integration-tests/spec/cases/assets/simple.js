'use strict';

const Promise = require('bluebird');
const fs = require('fs');

const misc = require('../../misc')();
const wait = require('../../wait')();


module.exports = function simpleAssetTest() {
    const teraslice = misc.teraslice();

    describe('Asset Tests', () => {
        describe('After uploading an asset', () => {
            it('can be deleted', (done) => {
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
        });

        // Test a bad asset
        // curl -XPOST -H "Content-Type: application/octet-stream" localhost:45678/assets --data-binary spec/fixtures/assets/example_assets_1.zip
        // {"error":"asset.json was not found in root directory of asset bundle nor any immediate sub directory"}
        describe('Uploading a bad asset', () => {
            it('returns an error', (done) => {
                const testStream = fs.createReadStream('spec/fixtures/assets/example_bad_asset_1.zip');

                teraslice.assets.post(testStream)
                    .then(result => expect(JSON.parse(result).error).toMatch('asset.json was not found'))
                    .catch(fail)
                    .finally(done);
            });
        });


        // Type 1 Asset - asset.json at top level of zipfile
        // example_assets/
        // example_assets/drop_property/
        // example_assets/drop_property/index.js
        // asset.json
        describe('After starting a job with a Type 1 asset', () => {
            const jobSpecOrig = misc.newJob('generator-asset-once');
            const workers = jobSpecOrig.workers; // save for comparison

            it('should eventually have all workers active', (done) => {
                const testStream = fs.createReadStream('spec/fixtures/assets/example_asset_1.zip');

                teraslice.assets.post(testStream)
                    .then((result) => {
                        jobSpecOrig.assets = [JSON.parse(result)._id];
                        return teraslice.jobs.submit(jobSpecOrig);
                    })
                    .then((job) => {
                        job.waitForStatus('running');
                        return job;
                    })
                    .then(job => wait.forWorkersJoined(job.id(), workers, 20))
                    .then(r => expect(r).toEqual(workers))
                    .catch(fail)
                    .finally(done);
            });
        });

        // Type 2 Asset - asset.json in subdirectory of zipfile
        // example_assets/
        // example_assets/asset.json
        // example_assets/drop_property/
        // example_assets/drop_property/index.js
        describe('After starting a job with a Type 2 asset', () => {
            const jobSpecOrig = misc.newJob('generator-asset-once');
            const workers = jobSpecOrig.workers; // save for comparison

            it('should eventually have all workers active', (done) => {
                const testStream = fs.createReadStream('spec/fixtures/assets/example_asset_2.zip');

                teraslice.assets.post(testStream)
                    .then((result) => {
                        jobSpecOrig.assets = [JSON.parse(result)._id];
                        return teraslice.jobs.submit(jobSpecOrig);
                    })
                    .then((job) => {
                        job.waitForStatus('running');
                        return job;
                    })
                    .then(job => wait.forWorkersJoined(job.id(), workers, 20))
                    .then(r => expect(r).toEqual(workers))
                    .catch(fail)
                    .finally(done);
            });
        });
    });
};
