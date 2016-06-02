'use strict';

/*
 * This is basically a wrapper around the job_id that acts as a proxy
 * to the server. It looks like an object but does not store the job
 * state internally. Any access to the state currently goes to the server.
 * Depending on how usage of this API develops we may want to reconsider this.
 */
module.exports = function(config, job_id) {
    var request = require('./request')(config);

    function slicer(status) {
        return request.get("/jobs/" + job_id + "/_slicer" );
    }

    function action(action) {
        return request.post("jobs/" + job_id, {});
    }

    function status() {
        return request.get("/jobs/" + job_id)
            .then(function(job_spec) {
                return job_spec._status;
            });
    }

    function spec() {
        return request.get("/jobs/" + job_id);
    }

    return {
        start: () => { return action('_start') },
        stop: () => { return action('_stop') },
        pause: () => { return action('_pause') },
        resume: () => { return action('_resume') },
        slicer: slicer,
        status: status,
        spec: spec,
        id: () => { return job_id }
    }
}