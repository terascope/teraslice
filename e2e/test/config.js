'use strict';

const { ElasticsearchTestHelpers } = require('elasticsearch-store');
const { customAlphabet } = require('nanoid');
const path = require('path');

const {
    TEST_INDEX_PREFIX,
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_API_VERSION,
    ELASTICSEARCH_VERSION,
    OPENSEARCH_HOST,
    OPENSEARCH_VERSION,
} = ElasticsearchTestHelpers;

const BASE_PATH = path.join(__dirname, '..');
const CONFIG_PATH = path.join(BASE_PATH, '.config');
const ASSETS_PATH = path.join(BASE_PATH, '.assets');
const SPEC_INDEX_PREFIX = `${TEST_INDEX_PREFIX}spec`;
const EXAMPLE_INDEX_PREFIX = `${TEST_INDEX_PREFIX}example`;
const EXAMPLE_INDEX_SIZES = [100, 1000];

// the uniq cluster name
const CLUSTER_NAME = newId(`${TEST_INDEX_PREFIX}teracluster`, true, 2);

// The number of teraslice-worker instances (see the docker-compose.yml)
const DEFAULT_WORKERS = 2;
// The teraslice-master + the number of teraslice-worker instances (see the docker-compose.yml)
const DEFAULT_NODES = DEFAULT_WORKERS + 1;
// The number of workers per number (see the process-master.yaml and process-worker.yaml)
const WORKERS_PER_NODE = 8;

const {
    KAFKA_BROKER = 'locahost:9092',
    HOST_IP = '127.0.0.1',
    GENERATE_ONLY,
    TEST_OPENSEARCH = false,
    TEST_PLATFORM = 'native',
    KEEP_OPEN = false
} = process.env;

const TEST_HOST = TEST_OPENSEARCH ? OPENSEARCH_HOST : ELASTICSEARCH_HOST;

function newId(prefix, lowerCase = false, length = 15) {
    let characters = '0123456789abcdefghijklmnopqrstuvwxyz';

    if (!lowerCase) {
        characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }

    const id = customAlphabet(characters, length)();

    if (prefix) {
        return `${prefix}-${id}`;
    }

    return id;
}

module.exports = {
    EXAMPLE_INDEX_SIZES,
    EXAMPLE_INDEX_PREFIX,
    SPEC_INDEX_PREFIX,
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_VERSION,
    ELASTICSEARCH_API_VERSION,
    HOST_IP,
    KAFKA_BROKER,
    CLUSTER_NAME,
    TEST_INDEX_PREFIX,
    DEFAULT_NODES,
    DEFAULT_WORKERS,
    WORKERS_PER_NODE,
    BASE_PATH,
    CONFIG_PATH,
    ASSETS_PATH,
    OPENSEARCH_HOST,
    OPENSEARCH_VERSION,
    GENERATE_ONLY,
    newId,
    TEST_HOST,
    TEST_PLATFORM,
    KEEP_OPEN
};
