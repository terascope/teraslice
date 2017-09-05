'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var misc = require('../../misc')();
var wait = require('../../wait')();

module.exports = function() {
    var teraslice = misc.teraslice();
    
    describe('worker allocation', function() {

        it('should cycle through after state changes with other jobs running', function(done) {
            var job_spec1 = misc.newJob('generator');
            var job_spec2 = misc.newJob('generator');
            var job1_id;
            var job2_id;
            job_spec2.operations[1].name = 'second_generator';

            Promise.all([teraslice.jobs.submit(job_spec1), teraslice.jobs.submit(job_spec2)])
                .spread(function(job1, job2) {
                    job1_id = job1.id();
                    job2_id = job2.id();
                    expect(job1_id).toBeDefined();
                    expect(job2_id).toBeDefined();

                    return job1.waitForStatus('running')
                        .then(function() {
                            return job1.pause();
                        })
                        .then(function() {
                            return job1.waitForStatus('paused');
                        })
                        .then(function() {
                            return job1.resume();
                        })
                        .then(function() {
                            return job1.waitForStatus('running');
                        })
                        .then(function() {
                            return job1.stop();
                        })
                        .then(function() {
                            return job1.waitForStatus('stopped');
                        })
                        .then(function() {
                            return job2.stop();
                        })
                        .then(function() {
                            return job2.waitForStatus('stopped');
                        })
                })
                .catch(fail)
                .finally(done);
        });
    });

};
