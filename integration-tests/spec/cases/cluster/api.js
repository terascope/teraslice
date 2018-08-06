'use strict';

const fs = require('fs');
const _ = require('lodash');
const misc = require('../../misc');


describe('api endpoint', () => {
    const teraslice = misc.teraslice();
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
        const alteredJob = _.cloneDeep(jobSpec);
        alteredJob.workers = 2;
        delete alteredJob.slicers;
        let jobId;

        teraslice.jobs.submit(jobSpec, 'shouldNotStart')
            .then((job) => {
                jobId = job.id();
                expect(jobId).toBeDefined();
                return job.spec()
                    .then((jobConfig) => {
                        expect(jobConfig.slicers).toEqual(1);
                        expect(jobConfig.workers).toEqual(3);
                        return teraslice.cluster.put(`/jobs/${jobId}`, alteredJob);
                    })
                    .then(() => job.spec())
                    .then((jobConfig) => {
                        // This will check that assets are not parsed as well
                        expect(jobConfig.assets).toEqual(alteredJob.assets);
                        expect(jobConfig.workers).toEqual(alteredJob.workers);
                        expect(jobConfig.slicers).not.toBeDefined();
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

                return job.waitForStatus('completed', 100);
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

    it('api end point /assets should return an array of json objects of asset metadata', done => teraslice.cluster.get('/assets')
        .then((response) => {
            expect(_.isArray(response)).toBe(true);
            expect(_.isPlainObject(response[0])).toBe(true);
            expect(_.has(response[0], '_created')).toBe(true);
            expect(_.has(response[0], 'name')).toBe(true);
            expect(_.has(response[0], 'id')).toBe(true);
            expect(_.has(response[0], 'version')).toBe(true);
        })
        .catch(fail)
        .finally(done));

    it('api end point /assets/assetName should return an array of json objects of asset metadata', (done) => {
        teraslice.cluster.get('/assets/ex1')
            .then((response) => {
                expect(_.isArray(response)).toBe(true);
                expect(_.isPlainObject(response[0])).toBe(true);
                expect(_.has(response[0], '_created')).toBe(true);
                expect(_.has(response[0], 'name')).toBe(true);
                expect(_.has(response[0], 'id')).toBe(true);
                expect(_.has(response[0], 'version')).toBe(true);
            })
            .catch(fail)
            .finally(done);
    });

    it('api end point /assets/assetName/version should return an array of json objects of asset metadata', (done) => {
        teraslice.cluster.get('/assets/ex1/0.0.1')
            .then((response) => {
                expect(_.isArray(response)).toBe(true);
                expect(_.isPlainObject(response[0])).toBe(true);
                expect(_.has(response[0], '_created')).toBe(true);
                expect(_.has(response[0], 'name')).toBe(true);
                expect(_.has(response[0], 'id')).toBe(true);
                expect(_.has(response[0], 'version')).toBe(true);
            })
            .catch(fail)
            .finally(done);
    });

    it('api end point /txt/assets should return a text table', (done) => {
        teraslice.cluster.txt('assets')
            .then((response) => {
                expect(_.isArray(response)).toBe(false);
                expect(typeof response).toBe('string');
            })
            .catch(fail)
            .finally(done);
    });

    it('api end point /txt/assets/assetName should return a text table', (done) => {
        teraslice.cluster.txt('assets/ex1')
            .then((response) => {
                expect(_.isArray(response)).toBe(false);
                expect(typeof response).toBe('string');
            })
            .catch(fail)
            .finally(done);
    });

    it('api end point /txt/assets/assetName/version should return a text table', (done) => {
        teraslice.cluster.txt('assets/ex1/0.0.1')
            .then((response) => {
                expect(_.isArray(response)).toBe(false);
                expect(typeof response).toBe('string');
            })
            .catch(fail)
            .finally(done);
    });
});
