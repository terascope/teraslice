'use strict';

const ElasticsearchClient = require('elasticsearch').Client;
const {
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_API_VERSION,
    TEST_INDEX_PREFIX
} = require('./test.config');

const client = new ElasticsearchClient({
    host: ELASTICSEARCH_HOST,
    log: '', // This suppresses error logging from the ES library.
    apiVersion: ELASTICSEARCH_API_VERSION
});

module.exports = async () => {
    await client.indices.delete({ index: `${TEST_INDEX_PREFIX}*` });
};
