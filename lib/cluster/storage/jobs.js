'use strict';

const uuid = require('uuid');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function module(context) {
    const logger = context.apis.foundation.makeLogger({ module: 'job_storage' });
    const config = context.sysconfig.teraslice;
    const jobType = 'job';
    const jobsIndex = `${config.name}__jobs`;

    let backend;

    function getJob(jobId) {
        return backend.get(jobId);
    }

    function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }

    function create(record) {
        const date = new Date();
        record.job_id = uuid.v4();
        record._context = jobType;
        record._created = date;
        record._updated = date;

        return backend.create(record);
    }

    function indexWithId(jobId, updateSpec) {
        updateSpec._updated = new Date();
        return backend.indexWithId(jobId, updateSpec);
    }

    function remove(jobId) {
        return backend.remove(jobId);
    }

    function shutdown() {
        logger.info('shutting down.');
        return backend.shutdown();
    }

    const api = {
        get: getJob,
        search,
        create,
        indexWithId,
        remove,
        shutdown
    };

    return require('./backends/elasticsearch_store')(context, jobsIndex, 'job', 'job_id')
        .then((elasticsearch) => {
            logger.info('Initializing');
            backend = elasticsearch;
            return api;
        });
};
