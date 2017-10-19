'use strict';

var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');
var template = require('./backends/mappings/analytics.json');
var timeseriesIndex = require('../../utils/date_utils').timeseriesIndex;


// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context) {
    var logger = context.foundation.makeLogger({module: 'analytics_storage'});
    var config = context.sysconfig.teraslice;
    var worker_id = context.sysconfig.teraslice.hostname + "__" + context.cluster.worker.id;
    var _index = `${config.name}__analytics`;
    //making this to pass down to backend for dynamic index searches
    var index_name = `${_index}*`;
    var timeseriesFormat = config.index_rollover_frequency.analytics;

    var backend;

    function log(job, slice_info, stats) {
        var results = [];
        var indexData = timeseriesIndex(timeseriesFormat, _index);
        var esIndex = indexData.index;
        var timestamp = indexData.timestamp;
        // These records are uniquely identified by ex_id + slice_id
        job.jobConfig.operations.forEach(function(op, index) {
            results.push(backend.bulk({
                "@timestamp": timestamp,
                ex_id: job.jobConfig.ex_id,
                job_id: job.jobConfig.job_id,
                worker_id: worker_id,
                slice_id: slice_info.slice_id,
                slicer_id: slice_info.slicer_id,
                op: op._op,
                order: index,
                count: stats.size[index],
                time: stats.time[index],
                memory: stats.memory[index]
            }, null, esIndex));
        });

        return Promise.all(results);
    }

    function get(record_id, index) {
        return backend.get(record_id, index);
    }

    function search(query, from, size) {
        return backend.search(query, from, size);
    }


    function update(record_id, update_spec, index) {
        return backend.update(record_id, update_spec, index);
    }

    function remove(record_id, index) {
        return backend.remove(record_id, index);
    }

    function shutdown() {
        logger.info("shutting down.");
        return backend.shutdown();
    }

    var api = {
        log: log,
        get: get,
        search: search,
        update: update,
        remove: remove,
        shutdown: shutdown
    };

    return require('./backends/elasticsearch_store')(context, index_name, 'analytics', '_id')
        .then(function(elasticsearch) {
            var name = 'analytics_template';
            backend = elasticsearch;
            return elasticsearch.putTemplate(template, name)
        })
        .then(function() {
            logger.info("AnalyticsStorage: initializing");
            return api;
        });
};