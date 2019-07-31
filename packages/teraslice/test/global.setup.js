'use strict';

const ElasticsearchClient = require('elasticsearch').Client;
const { newId } = require('../lib/utils/id_utils');

const TEST_INDEX_PREFIX = 'teratest_';

const {
    ELASTICSEARCH_HOST = 'http://localhost:9200',
    TERASLICE_CLUSTER_NAME = newId(`${TEST_INDEX_PREFIX}teraslice`, true, 2)
} = process.env;

process.env.TERASLICE_CLUSTER_NAME = TERASLICE_CLUSTER_NAME;
process.env.ELASTICSEARCH_HOST = ELASTICSEARCH_HOST;

const es = new ElasticsearchClient({
    host: ELASTICSEARCH_HOST,
    log: '' // This suppresses error logging from the ES library.
});

module.exports = async () => {
    await es.indices.delete({ index: `${TEST_INDEX_PREFIX}*` });
};
