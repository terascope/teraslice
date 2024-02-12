import { ElasticsearchTestHelpers } from 'elasticsearch-store';
import { customAlphabet } from 'nanoid';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const {
    TEST_INDEX_PREFIX,
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_API_VERSION,
    ELASTICSEARCH_VERSION,
    OPENSEARCH_HOST,
    OPENSEARCH_VERSION,
} = ElasticsearchTestHelpers;

const filePath = fileURLToPath(new URL(import.meta.url));
/*
from the execution of the test from how its called internally and externally it deviates
"some/path/terascope/teraslice/e2e/test/config.ts
            vs
"some/path/terascope/teraslice/e2e/dist/test/config.js
so we search for the e2e part and slice that off to make both work
*/
const pathLength = filePath.lastIndexOf('e2e') + 3;

const BASE_PATH = filePath.slice(0, pathLength);
const CONFIG_PATH = path.join(BASE_PATH, '.config');
const ASSETS_PATH = path.join(BASE_PATH, '.assets');
const AUTOLOAD_PATH = path.join(BASE_PATH, 'autoload');
const LOG_PATH = path.join(BASE_PATH, 'logs/teraslice.log');
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
    KEEP_OPEN = false,
    NODE_VERSION
} = process.env;

const TEST_HOST = TEST_OPENSEARCH ? OPENSEARCH_HOST : ELASTICSEARCH_HOST;

// TERASLICE_PORT must match e2e/docker-compose.yml
const TERASLICE_PORT = 45678;

function newId(prefix?: string, lowerCase = false, length = 15) {
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

export {
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
    LOG_PATH,
    AUTOLOAD_PATH,
    OPENSEARCH_HOST,
    OPENSEARCH_VERSION,
    GENERATE_ONLY,
    newId,
    TEST_HOST,
    TEST_PLATFORM,
    TERASLICE_PORT,
    KEEP_OPEN,
    NODE_VERSION
};
