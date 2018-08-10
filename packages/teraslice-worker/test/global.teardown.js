'use strict';

const ElasticsearchClient = require('elasticsearch').Client;

const { TERASLICE_CLUSTER_NAME, ELASTICSEARCH_HOST } = process.env;

const es = new ElasticsearchClient({
    host: ELASTICSEARCH_HOST,
    log: '' // This suppresses error logging from the ES library.
});

module.exports = async () => {
    await es.indices.delete({ index: `${TERASLICE_CLUSTER_NAME}*` });
};
