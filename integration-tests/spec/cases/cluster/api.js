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
                            return teraslice.cluster.put(`/jobs/${jobId}`, jobSpec);
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

        it('will not send lifecycle changes to executions that are not active', (done) => {
            const jobSpec = misc.newJob('reindex');
            jobSpec.name = 'basic reindex for lifecycle';
            jobSpec.operations[1].index = 'test-reindex-10-lifecycle';
            let jobId;
            let exId;

            function didError(Prom) {
                return Promise.resolve()
                    .then(() => Prom)
                    .then(() => false)
                    .catch(() => true);
            }

            teraslice.jobs.submit(jobSpec)
                .then((job) => {
                    expect(job).toBeDefined();
                    expect(job.id()).toBeDefined();
                    jobId = job.id();

                    return job.waitForStatus('completed');
                })
                .then(() => teraslice.cluster.get(`/jobs/${jobId}/ex`))
                .then((ex) => {
                    exId = ex.ex_id;
                    return Promise.all([
                        didError(teraslice.cluster.post(`/jobs/${jobId}/_stop`)),
                        didError(teraslice.cluster.post(`/jobs/${jobId}/_resume`)),
                        didError(teraslice.cluster.post(`/jobs/${jobId}/_pause`)),
                        didError(teraslice.cluster.post(`/ex/${exId}/_stop`)),
                        didError(teraslice.cluster.post(`/ex/${exId}/_resume`)),
                        didError(teraslice.cluster.post(`/ex/${exId}/_pause`)),
                    ]);
                })
                .catch(fail)
                .finally(done);
        });
    });
};
