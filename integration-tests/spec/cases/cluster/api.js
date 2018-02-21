'use strict';

const misc = require('../../misc')();
const fs = require('fs');
const _ = require('lodash');

module.exports = function () {
    const teraslice = misc.teraslice();

    describe('api endpoint', () => {
        xit('submitted jobs are not saved in validated form', (done) => {
            const assetPath = 'spec/fixtures/assets/example_asset_1.zip';
            const testStream = fs.createReadStream(assetPath);
            const jobSpec = misc.newJob('generator-asset');
            let jobId;
            let execution;
            let exId;
            let job;

            teraslice.assets.post(testStream)
                .then(() => teraslice.jobs.submit(jobSpec))
                .then((_job) => {
                    job = _job;
                    jobId = job.id();
                    console.log('what job id', jobId);
                    return teraslice.cluster.get(`/jobs/${jobId}/ex`)
                        .then((_execution) => {
                            execution = _execution;
                            exId = execution.ex_id;
                            return Promise.all([
                                job.spec(),
                                teraslice.cluster.get(`/ex/${exId}`),
                                teraslice.cluster.get(`/jobs/${jobId}/ex`)
                            ]);
                        })
                        .spread((jobConfig, exApiExecution, jobApiExecution) => {
                            // checking the jobConfig is same as submitted
                            _.forOwn(jobSpec, (value, key) => {
                                expect(jobConfig[key]).toEqual(value);
                            });

                            expect(exApiExecution).toEqual(jobApiExecution);
                            return teraslice.cluster.state();
                        })
                        .then(clusterState => {
                            console.log('the state', _.flatMap(clusterState, (state) => state.active));
                            return true;
                        })
                        .then(() => {
                            console.log('i should be stopping', job.stop);
                            return job.stop()
                        });
                })
                .catch(() => {
                    job.stop();
                    fail();
                })
                .finally(done);
        });

        xit('should update job specs', (done) => {
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

        xit('should get cluster state', (done) => {
            // NOTE that this relies on the asset loaded in the test above
            const jobSpec = misc.newJob('generator-asset');
            let jobId;

            teraslice.cluster.state()
                .then(state => console.log('state', _.values(state)[1]))
                .catch(fail)
                .finally(done)
            /*teraslice.jobs.submit(jobSpec, 'shouldNotStart')
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
                .finally(done);*/
        });
    });
};
