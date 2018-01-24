'use strict';

const misc = require('../../misc')();
const fs = require('fs');
const _ = require('lodash');

module.exports = function () {
    const teraslice = misc.teraslice();

    describe('api endpoint', () => {
        it('submitted jobs are not saved in validated form', (done) => {
            const assetPath = 'spec/fixtures/assets/example_asset_1.zip';
            const testStream = fs.createReadStream(assetPath);
            const jobSpec = misc.newJob('generator-asset');

            teraslice.assets.post(testStream)
                .then(() => teraslice.jobs.submit(jobSpec, 'shouldNotStart'))
                .then(job => job.spec())
                .then((jobConfig) => {
                    _.forOwn(jobSpec, (value, key) => {
                        expect(jobConfig[key]).toEqual(value);
                    });
                })
                .catch(fail)
                .finally(done);
        });

        it('should update job specs', (done) => {
            // NOTE that this relies on the asset loaded in the test above
            const jobSpec = misc.newJob('generator-asset');
            let jobId;

            teraslice.jobs.submit(jobSpec, 'shouldNotStart')
                .then((job) => {
                    jobId = job.id();
                    expect(jobId).toBeDefined();
                    return job.spec()
                        .then((jobConfig) => {
                            expect(jobConfig.workers).toEqual(3);
                            jobSpec.workers = 2;
                            return job.put(`/jobs/${jobId}`, jobSpec);
                        })
                        .then(() => job.spec())
                        .then((jobConfig) => {
                            // This will check that assets are not parsed as well
                            _.forOwn(jobSpec, (value, key) => {
                                expect(jobConfig[key]).toEqual(value);
                            });
                        });
                })
                .catch(fail)
                .finally(done);
        });
    });
};
