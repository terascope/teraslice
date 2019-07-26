'use strict';

const ElasticsearchClient = require('elasticsearch').Client;
const { newId } = require('../lib/utils/id_utils');

const TEST_INDEX_PREFIX = 'test__';

const {
    ELASTICSEARCH_URL = 'http://localhost:9200',
    TERASLICE_CLUSTER_NAME = newId(`${TEST_INDEX_PREFIX}_teraslice`, true, 2)
} = process.env;

process.env.TERASLICE_CLUSTER_NAME = TERASLICE_CLUSTER_NAME;
process.env.ELASTICSEARCH_URL = ELASTICSEARCH_URL;

const es = new ElasticsearchClient({
    host: ELASTICSEARCH_URL,
    log: '' // This suppresses error logging from the ES library.
});

module.exports = async () => {
    await es.indices.delete({ index: `${TEST_INDEX_PREFIX}*` });
};
