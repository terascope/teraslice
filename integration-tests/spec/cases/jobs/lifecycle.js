'use strict';

let misc = require('../../misc')();
let teraslice = misc.teraslice;

module.exports = function() {
    describe('A once job should', function() {
        fit('generate a 1000 docs and complete', function(done) {
          let jobSpec = misc.newJob('gen');

          teraslice().jobs.submit(jobSpec)
            .then(function(job) {
              return job
                .waitForStatus('running')
                .then(function() {
                  return job.waitForStatus('completed');
                })
                .then(function() {
                    return misc.indexStats(jobSpec.operations[1].index)
                        .then(function(stats) {
                            expect(stats.count).toBe(1000);
                        });
                });
            })
            .catch(fail)
            .finally(function() {
                misc.es().indices.delete({index: jobSpec.operations[1].index}),
                done();
            });
        });
    });

    describe('A persistent job should', function() {
        fit('generate data for ever, more than 1000 docs', function(done) {
          let jobSpec = misc.newJob('gen');
          jobSpec.lifecycle = 'persistent';
          jobSpec.operations[1].index = 'gen-persistent-test';

          teraslice().jobs.submit(jobSpec)
            .then(function(job) {
              return job
                .waitForStatus('running')
                .delay(5000)
                .then(function() {
                    return misc.indexStats(jobSpec.operations[1].index)
                        .then(function(stats) {
                            expect(stats.count).toBeGreaterThan(1000);
                        });
                })
                .then(function() {
                    return job.stop();
                })
                .then(function() {
                    return job.waitForStatus('stopped');
                });
            })
            .catch(fail)
            .finally(function() {
                misc.es().indices.delete(
                  {index: jobSpec.operations[1].index}
                ),
                done();
            });
        });
    });
};
