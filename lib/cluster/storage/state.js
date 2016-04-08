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

    function buildRetryQueue(job_id) {
        var retryQueue = new Queue;

        var startQuery = "job_id:" + job_id;

        var retryQuery = "job_id:" + job_id + " AND NOT state:completed";

// TODO: size could be an issue here.
        // Look for all slices that haven't been completed so they can be retried.
        return backend.search(retryQuery, 0, 10000)
            .then(function(results){
                results.forEach(function(doc) {
                    retryQueue.enqueue(doc.msg)
                });

                // Find the newest record to see where to start processing from
                return backend.search(startQuery, 0, 1, 'msg.end:desc').then(function(result) {
                    return {
                        retryQueue: retryQueue,
                        startFrom: result.end
                    };
                })
            })
            .catch(function(e) {
                throw new Error('StateStorage: An error has occurred accessing the state log for retry: ' + e)
            });

        /*var startQuery = {
            index: stateName,
            size: 1,
            body: {
                sort: [
                    {'msg.end': {order: 'desc'}}
                ]
            }
        };

        var retryQuery = {
            index: stateName,
            body: {
                query: {
                    bool: {
                        must_not: {
                            match: {
                                state: 'completed'
                            }
                        }
                    }
                }
            }
        };

        return new Promise(function(resolve, reject) {
            client.search(retryQuery).then(function(data) {
                data.hits.hits.forEach(function(doc) {
                    retryQueue.enqueue(doc._source.msg)
                });
                client.search(startQuery).then(function(newStart) {
                    resolve({retryQueue: retryQueue, startFrom: newStart.hits.hits[0]._source.msg.end})
                })
            }).catch(function(e) {
                throw new Error('An error has occurred accessing the state log for retry: ' + e)
            });
        })*/
    }

    function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }

    return {
        search: search,
        log: log,
        buildRetryQueue: buildRetryQueue
    }
}