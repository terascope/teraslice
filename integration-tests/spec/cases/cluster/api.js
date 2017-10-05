'use strict';

var misc = require('../../misc')();
var wait = require('../../wait')();
var request = require('request');

module.exports = function() {
    var teraslice = misc.teraslice();

    describe('api endpoint', function() {
        // TODO need to test case of jobs with assets
        it('should update job specs', function(done) {
            var job_spec = misc.newJob('generator');
            var job_id;

            teraslice.jobs.submit(job_spec)
                .then(function(job) {
                    job_id = job.id();
                    expect(job_id).toBeDefined();

                    return job.waitForStatus('running')
                        .then(function() {
                            return job.spec();
                        })
                        .then(function(jobSpec) {
                            expect(jobSpec.workers).toEqual(3);
                            jobSpec.workers = 2;
                            return job.put(`/jobs/${job_id}`, jobSpec);
                        })
                        .then(function() {
                            return job.spec();
                        })
                        .then(function(jobSpec) {
                            expect(jobSpec.workers).toEqual(2);
                            return job.stop();
                        })

                })
                .catch(fail)
                .finally(done);
        });
    });

};