'use strict';

const uuid = require('uuid');
const { makeLogger } = require('../../workers/helpers/terafoundation');
const elasticsearchBackend = require('./backends/elasticsearch_store');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = async function jobsStorage(context) {
    const logger = makeLogger(context, 'job_storage');

    const config = context.sysconfig.teraslice;
    const jobType = 'job';
    const indexName = `${config.name}__jobs`;

    let backend;

    async function getJob(jobId) {
        return backend.get(jobId);
    }

    async function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }

    async function create(record) {
        const date = new Date();
        record.job_id = uuid.v4();
        record._context = jobType;
        record._created = date;
        record._updated = date;

        return backend.create(record);
    }

    async function update(jobId, updateSpec) {
        updateSpec._updated = new Date();
        updateSpec.job_id = jobId;
        updateSpec._context = 'job';
        // We want to save the whole job as it is posted, update api does partial doc updates
        return backend.indexWithId(jobId, updateSpec);
    }

    async function remove(jobId) {
        return backend.remove(jobId);
    }

    async function shutdown(forceShutdown) {
        logger.info('shutting down.');
        return backend.shutdown(forceShutdown);
    }

    function verifyClient() {
        return backend.verifyClient();
    }

    async function waitForClient() {
        return backend.waitForClient();
    }

    const api = {
        get: getJob,
        search,
        create,
        update,
        remove,
        verifyClient,
        waitForClient,
        shutdown
    };

    const backendConfig = {
        context,
        indexName,
        recordType: 'job',
        idField: 'job_id',
        fullResponse: false,
        logRecord: false,
        storageName: 'jobs'
    };

    backend = await elasticsearchBackend(backendConfig);
    logger.info('job storage initialized');
    return api;
};
