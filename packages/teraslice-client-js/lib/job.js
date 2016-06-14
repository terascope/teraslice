'use strict';

var _ = require('lodash');

var Promise = require('bluebird');

/*
 * This is basically a wrapper around the job_id that acts as a proxy
 * to the server. It looks like an object but does not store the job
 * state internally. Any access to the state currently goes to the server.
 * Depending on how usage of this API develops we may want to reconsider this.
 */
module.exports = function(config, job_id) {
    var request = require('./request')(config);

    function slicer(status) {
        return request.get("/jobs/" + job_id + "/slicer" );
    }

    function action(action, options) {
        var url = "/jobs/" + job_id + "/" + action;

        // options are converted into URL parameters.
        if (options) {
            url += '?'
            _.forOwn(options, function(value, option) {
                url += option + '=' + value;
            })
        }

        return request.post(url, {});
    }

    function status() {
        return request.get("/jobs/" + job_id)
            .then(function(job_spec) {
                return job_spec._status;
            });
    }

    function waitForStatus(target, timeout) {
        if (! timeout) timeout = 1000;

        return new Promise(function(resolve, reject) {
            function wait() {
                status()
                    .then(function(result) {
                        if (result === target) {
                            resolve(result);
                        }
                        else {
                            setTimeout(wait, timeout);
                        }

                        // These are terminal states for a job so if we're not explicitly
                        // watching for these then we need to stop waiting as the job
                        // status won't change further.
                        if (result === 'failed' || result === 'rejected' || result === 'aborted') {
                            reject("Job has status: '" + result + "' which is terminal so status: '" + target + "' is not possible.")
                        }
                    })
                    .catch(function(err) {
                        reject(err);
                    })
            }

            wait();
        })
    }

    function spec() {
        return request.get("/jobs/" + job_id);
    }

    function _filterProcesses(role) {
        return request.get("/cluster/state")
            .then(function(state) {
                var workers = _.reduce(state, function(workers, node) {
                    var found = _.filter(node.active, function(process) {
                        if (process.assignment == role && process.job_id == job_id) {
                            process.node_id = node.node_id;
                            return process;
                        }
                    });

                    if (found.length > 0) workers = workers.concat(found);
                    return workers;
                }, [])

                return workers;
            });
    }

    return {
        start: (options) => { return action('_start', options) },
        stop: (options) => { return action('_stop', options) },
        pause: (options) => { return action('_pause', options) },
        resume: (options) => { return action('_resume', options) },
        slicer: slicer,
        status: status,
        spec: spec,
        id: () => { return job_id },
        waitForStatus: waitForStatus,
        workers: () => { return _filterProcesses('worker') },
        //slicers: () => { return _filterProcesses('slicer') }
    }
}