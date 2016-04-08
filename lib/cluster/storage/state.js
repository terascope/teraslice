var Promise = require('bluebird');
var _ = require('lodash');

var Queue = require('../../utils/queue');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context) {
    var logger = context.logger;
    var config = context.sysconfig.teraslice;

    // TODO: this needs to be properly named
    var index_name = config.cluster.name + '__state';

    var backend = require('./backends/elasticsearch')(context, index_name, 'state', '_id');

    function log(job_id, slice_info, state) {
        var key = job_id + ":" + slice_info.start;

        return backend.indexWithId(key, {
                msg: slice_info,
                state: state,
                job_id: job_id
            });
    }

    function recoveryContext(job_id, recover_job) {
        if (recover_job) {
            logger.info("StateStorage: Preparing to recover job: " + job_id);
            var retryQueue = new Queue;

            var startQuery = "job_id:" + job_id;

            var retryQuery = "job_id:" + job_id + " AND NOT state:completed";

// TODO: size could be an issue here if there are a large number of failures
            // Look for all slices that haven't been completed so they can be retried.
            return backend.search(retryQuery, 0, 10000)
                .then(function(results){
                    results.forEach(function(doc) {
                        retryQueue.enqueue(doc.msg)
                    });

                    // Find the newest record to see where to start processing from
                    return backend.search(startQuery, 0, 1, 'msg.end:desc')
                        .then(function(results) {
                            var recoveryContext = {
                                retryQueue: retryQueue
                            };

                            if (results.length > 0) {
                                recoveryContext.startFrom = results[0].msg.end;
                            }

                            return recoveryContext;
                        })
                })
                .catch(function(e) {
                    throw new Error('StateStorage: An error has occurred accessing the state log for retry: ' + e)
                });
        }

        return Promise.resolve(false); // No recovery required.
    }

    function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }

    return {
        search: search,
        log: log,
        recoveryContext: recoveryContext
    }
}