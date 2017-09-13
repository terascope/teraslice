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
        return request.get(`/jobs/${job_id}/slicer`);
    }

    function job_action(action, options) {
        var url = `/jobs/${job_id}/${action}`;

        // options are converted into URL parameters.
        if (options) {
            url += '?';
            _.forOwn(options, function(value, option) {
                url += `${option}=${value}`;
            })
        }

        return request.post(url, {});
    }

    function ex_action(action, options) {
        var url = `/ex/${ex_id}/${action}`;

        // options are converted into URL parameters.
        if (options) {
            url += '?';
            _.forOwn(options, function(value, option) {
                url += `${option}=${value}`;
            })
        }

        return request.post(url, {});
    }

    function ex_id() {
        return request.get(`/jobs/${job_id}/ex`)
            .then(function(job_spec) {
                return job_spec.ex_id;
            });
    }

    function status() {
        return request.get(`/jobs/${job_id}/ex`)
            .then(function(job_spec) {
                return job_spec._status;
            });
    }

    function waitForStatus(target, timeout) {
        if (!timeout) timeout = 1000;

        return new Promise(function(resolve, reject) {
            // Not all terminal states considered failure.
            var terminal = {
                completed: false,
                failed: true,
                rejected: true,
                aborted: true
            };
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
                        if (terminal[result] !== undefined) {
                            if (terminal[result]) {
                                reject(`Job has status: "${result}" which is terminal so status: "${target}" is not possible. job_id: ${job_id}`)
                            }
                            else {
                                resolve(result)
                            }
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
        return request.get(`/jobs/${job_id}`);
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
                }, []);

                return workers;
            });
    }

    function changeWorkers(param, workerNum){
        var url = `/jobs/${job_id}/_workers?${param}=${workerNum}`;
        return request.post(url)
    }
    
    function post(endpoint, data){
        return request.post(endpoint, data)
    }

    function put(endpoint, data){
        return request.put(endpoint, data)
    }

    function deleteFn(endpoint){
        return request.delete(endpoint)
    }

    return {
        start: (options) => {
            return job_action('_start', options)
        },
        recover: (options) => {
            return job_action('_recover', options)
        },
        stop: (options) => {
            return job_action('_stop', options)
        },
        pause: (options) => {
            return job_action('_pause', options)
        },
        resume: (options) => {
            return job_action('_resume', options)
        },
        slicer: slicer,
        status: status,
        spec: spec,
        id: () => {
            return job_id
        },
        ex: ex_id,
        waitForStatus: waitForStatus,
        workers: () => {
            return _filterProcesses('worker')
        },
        changeWorkers: changeWorkers,
        post: post,
        put: put,
        delete: deleteFn
        
    }
};
