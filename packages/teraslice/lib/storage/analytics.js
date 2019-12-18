'use strict';

const { makeLogger } = require('../workers/helpers/terafoundation');
const { timeseriesIndex } = require('../utils/date_utils');
const elasticsearchBackend = require('./backends/elasticsearch_store');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = async function analyticsService(context) {
    const logger = makeLogger(context, 'analytics_storage');
    const config = context.sysconfig.teraslice;
    const workerId = `${context.sysconfig.teraslice.hostname}__${context.cluster.worker.id}`;
    const _index = `${config.name}__analytics`;
    // making this to pass down to backend for dynamic index searches
    const indexName = `${_index}*`;
    const timeseriesFormat = config.index_rollover_frequency.analytics;

    const backendConfig = {
        context,
        indexName,
        recordType: 'analytics',
        idField: '_id',
        fullResponse: false,
        logRecord: false,
        forceRefresh: false,
        storageName: 'analytics',
    };

    const backend = await elasticsearchBackend(backendConfig);

    async function log(job, sliceInfo, stats, state = 'completed') {
        const indexData = timeseriesIndex(timeseriesFormat, _index);
        const esIndex = indexData.index;
        const { timestamp } = indexData;

        // These records are uniquely identified by ex_id + slice_id
        const results = job.config.operations.map((op, index) => backend.bulk(
            {
                '@timestamp': timestamp,
                ex_id: job.config.ex_id,
                job_id: job.config.job_id,
                worker_id: workerId,
                slice_id: sliceInfo.slice_id,
                slicer_id: sliceInfo.slicer_id,
                op: op._op,
                state,
                order: index,
                count: stats.size[index],
                time: stats.time[index],
                memory: stats.memory[index],
            },
            null,
            esIndex
        ));

        return Promise.all(results);
    }

    async function getRecord(recordId, index) {
        return backend.get(recordId, index);
    }

    async function search(query, from, size) {
        return backend.search(query, from, size);
    }

    async function update(recordId, updateSpec, index) {
        return backend.update(recordId, updateSpec, index);
    }

    async function remove(recordId, index) {
        return backend.remove(recordId, index);
    }

    async function shutdown(forceShutdown) {
        logger.info('shutting down.');
        return backend.shutdown(forceShutdown);
    }

    async function refresh() {
        const { index } = timeseriesIndex(timeseriesFormat, _index);
        return backend.refresh(index);
    }

    function verifyClient() {
        return backend.verifyClient();
    }

    async function waitForClient() {
        return backend.waitForClient();
    }

    logger.info('analytics storage initialized');
    return {
        log,
        get: getRecord,
        search,
        update,
        remove,
        shutdown,
        refresh,
        waitForClient,
        verifyClient,
    };
};
