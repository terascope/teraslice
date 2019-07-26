'use strict';

const ElasticsearchClient = require('elasticsearch').Client;

const TEST_INDEX_PREFIX = 'teratest_';
const { ELASTICSEARCH_URL } = process.env;

const es = new ElasticsearchClient({
    host: ELASTICSEARCH_URL,
    log: '' // This suppresses error logging from the ES library.
});

module.exports = async () => {
    await es.indices.delete({ index: `${TEST_INDEX_PREFIX}*` });
};
