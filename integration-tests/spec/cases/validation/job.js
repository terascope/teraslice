'use strict'

var Promise = require('bluebird')
var _ = require('lodash')
var misc = require('../../misc')

module.exports = function() {
    describe('job validation', function() {

        it('should be rejected with empty index selector index name', function(done) {
            var job_spec = misc.newJob('reindex')
            job_spec.operations[1].index = ''; // index selector

            misc.teraslice().jobs.submit(job_spec)
                .then(function() {
                    fail("Submission should not succeed when no index is specified.")
                }) // This should throw a validation error.
                .catch(function(err) {
                    expect(err.error).toBe(500);
                })
                .finally(done)
        });

        it('should be rejected with empty reader index name', function(done) {
            var job_spec = misc.newJob('reindex')
            job_spec.operations[0].index = ''; // reader

            misc.teraslice().jobs.submit(job_spec)
                .catch(function(err) {
                    expect(err.error).toBe(500);
                })
                .finally(done)
        });

        it('should be rejected with slicers = 0', function(done) {
            var job_spec = misc.newJob('reindex')
            job_spec.slicers = 0;

            misc.teraslice().jobs.submit(job_spec)
                .then(function() {
                    fail("Submission should not succeed when slicers == 0")
                }) // This should throw a validation error.
                .catch(function(err) {
                    expect(err.error).toBe(500);
                })
                .finally(done)
        });

        it('should be rejected with slicers < 0', function(done) {
            var job_spec = misc.newJob('reindex')
            job_spec.slicers = -1;

            misc.teraslice().jobs.submit(job_spec)
                .then(function() {
                    fail("Submission should not succeed when slicers == -1")
                }) // This should throw a validation error.
                .catch(function(err) {
                    expect(err.error).toBe(500);
                })
                .finally(done)
        });

        it('should be rejected with negative workers == 0', function(done) {
            var job_spec = misc.newJob('reindex')
            job_spec.workers = 0;

            misc.teraslice().jobs.submit(job_spec)
                .then(function() {
                    fail("Submission should not succeed when workers == 0")
                }) // This should throw a validation error.
                .catch(function(err) {
                    expect(err.error).toBe(500);
                })
                .finally(done)
        });

        it('should be rejected with invalid lifecycle', function(done) {
            var job_spec = misc.newJob('reindex')
            job_spec.lifecycle = 'invalid';

            misc.teraslice().jobs.submit(job_spec)
                .then(function() {
                    fail("Submission should not succeed when lifecycle is invalid")
                }) // This should throw a validation error.
                .catch(function(err) {
                    expect(err.error).toBe(500);
                })
                .finally(done)
        });

        it('should be rejected if empty', function(done) {
            var job_spec = {};

            misc.teraslice().jobs.submit(job_spec)
                .then(function() {
                    fail("Submission should not succeed when job is empty")
                }) // This should throw a validation error.
                .catch(function(err) {
                    expect(err.error).toBe(400);
                })
                .finally(done)
        });
    });
};
