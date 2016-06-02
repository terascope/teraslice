'use strict';

module.exports = function(config) {
    var request = require('./request')(config);
    var newjob = require('./job');

    function submit(job_spec) {
        return request.post("/jobs", job_spec)
            .then(function(result) {
                return newjob(config, result.job_id);
            });
    }

    function list(status) {
        if (! status) status = '';

        return request.get("/jobs?status=" + status);
    }

    // Wraps the job_id with convenience functions for accessing
    // the state on the server.
    function wrap(job_id) {
        return newjob(config, job_id);
    }

    return {
        submit: submit,
        list: list,
        wrap: wrap
    }
}