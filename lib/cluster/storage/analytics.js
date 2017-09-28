'use strict';

const Promise = require('bluebird');
const template = require('./backends/mappings/analytics.json');
const timeseriesIndex = require('../../utils/date_utils').timeseriesIndex;


// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function module(context) {
    const logger = context.foundation.makeLogger({ module: 'analytics_storage' });
    const config = context.sysconfig.teraslice;
    const workerId = `${context.sysconfig.teraslice.hostname}__${context.cluster.worker.id}`;
    const _index = `${config.name}__analytics`;
    // making this to pass down to backend for dynamic index searches
    const indexName = `${_index}*`;
    const timeseriesFormat = config.index_rollover_frequency.analytics;

    let backend;

    function log(job, sliceInfo, stats) {
        const results = [];
        const indexData = timeseriesIndex(timeseriesFormat, _index);
        const esIndex = indexData.index;
        const timestamp = indexData.timestamp;
        // These records are uniquely identified by ex_id + slice_id
        job.jobConfig.operations.forEach((op, index) => {
            results.push(backend.bulk({
                '@timestamp': timestamp,
                ex_id: job.jobConfig.ex_id,
                job_id: job.jobConfig.job_id,
                worker_id: workerId,
                slice_id: sliceInfo.slice_id,
                slicer_id: sliceInfo.slicer_id,
                op: op._op,
                order: index,
                count: stats.size[index],
                time: stats.time[index],
                memory: stats.memory[index]
            }, null, esIndex));
        });

        return Promise.all(results);
    }

    function getRecord(recordId, index) {
        return backend.get(recordId, index);
    }

    function search(query, from, size) {
        return backend.search(query, from, size);
    }


    function update(recordId, updateSpec, index) {
        return backend.update(recordId, updateSpec, index);
    }

    function remove(recordId, index) {
        return backend.remove(recordId, index);
    }

    function shutdown() {
        logger.info('shutting down.');
        return backend.shutdown();
    }

    const api = {
        log,
        get: getRecord,
        search,
        update,
        remove,
        shutdown
    };

    return require('./backends/elasticsearch_store')(context, indexName, 'analytics', '_id')
        .then((elasticsearch) => {
            const name = 'analytics_template';
            backend = elasticsearch;
            return elasticsearch.putTemplate(template, name);
        })
        .then(() => {
            logger.info('AnalyticsStorage: initializing');
            return api;
        });
};
