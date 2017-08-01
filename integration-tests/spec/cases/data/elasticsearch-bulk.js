'use strict'

var _ = require('lodash')
var misc = require('../../misc')

module.exports = function() {
    var teraslice = misc.teraslice()

    describe('elasticsearch bulk', function() {

        it('should support multisend', function(done) {
            var job_spec = misc.newJob('multisend')
            job_spec.name = 'multisend'
            job_spec.operations[1].index = 'test-multisend-10000';

            teraslice.jobs.submit(job_spec)
                .then(function(job) {
                    expect(job).toBeDefined();
                    expect(job.id()).toBeDefined();
                    return job.waitForStatus('completed');
                })
                .then(function() {
                    return misc.indexStats('test-multisend-10000')
                        .then(function(stats) {
                            expect(stats.count).toBe(10000);
                        });
                })
                .catch(fail)
                .finally(done)
        });
    });
};
