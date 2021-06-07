import { address } from 'ip';
import { toBoolean, toSafeString, isCI } from '@terascope/utils';

const forceColor = process.env.FORCE_COLOR || '1';
export const FORCE_COLOR = toBoolean(forceColor)
    ? '1'
    : '0';

export const HOST_IP = process.env.HOST_IP || address();
export const USE_EXISTING_SERVICES = toBoolean(process.env.USE_EXISTING_SERVICES);
export const SERVICES_USE_TMPFS = toBoolean(process.env.SERVICES_USE_TMPFS || 'true');
export const SERVICE_HEAP_OPTS = process.env.SERVICE_HEAP_OPTS || '-Xms512m -Xmx512m';
export const DOCKER_NETWORK_NAME = process.env.DOCKER_NETWORK_NAME || undefined;
export const TEST_NAMESPACE = process.env.TEST_NAMESPACE || 'ts_test';

export const ELASTICSEARCH_NAME = process.env.ELASTICSEARCH_NAME || 'elasticsearch';
export const ELASTICSEARCH_HOSTNAME = process.env.ELASTICSEARCH_HOSTNAME || HOST_IP;
export const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || '49200';
export const ELASTICSEARCH_HOST = `http://${ELASTICSEARCH_HOSTNAME}:${ELASTICSEARCH_PORT}`;
export const ELASTICSEARCH_VERSION = process.env.ELASTICSEARCH_VERSION || '6.8.6';
export const ELASTICSEARCH_API_VERSION = process.env.ELASTICSEARCH_API_VERSION || '6.5';
export const ELASTICSEARCH_DOCKER_IMAGE = process.env.ELASTICSEARCH_DOCKER_IMAGE || 'blacktop/elasticsearch';

export const KAFKA_NAME = process.env.KAFKA_NAME || 'kafka';
export const KAFKA_HOSTNAME = process.env.KAFKA_HOSTNAME || HOST_IP;
export const KAFKA_PORT = process.env.KAFKA_PORT || '49092';
export const KAFKA_BROKER = `${KAFKA_HOSTNAME}:${KAFKA_PORT}`;
export const KAFKA_VERSION = process.env.KAFKA_VERSION || '2.3';
export const KAFKA_DOCKER_IMAGE = process.env.KAFKA_DOCKER_IMAGE || 'blacktop/kafka';

export const MINIO_NAME = process.env.MINIO_NAME || 'minio';
export const MINIO_HOSTNAME = process.env.MINIO_HOSTNAME || HOST_IP;
export const MINIO_PORT = process.env.MINIO_PORT || '49000';
export const MINIO_HOST = `http://${MINIO_HOSTNAME}:${MINIO_PORT}`;
export const MINIO_VERSION = process.env.MINIO_VERSION || 'RELEASE.2020-02-07T23-28-16Z';
export const MINIO_DOCKER_IMAGE = process.env.MINIO_DOCKER_IMAGE || 'minio/minio';
export const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
export const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';

// make sure the string doesn't contain unwanted characters
export const DEV_TAG = toSafeString((
    process.env.DEV_TAG
    || process.env.TRAVIS_PULL_REQUEST_BRANCH
    || process.env.TRAVIS_BRANCH
    || process.env.CI_COMMIT_REF_SLUG
    || 'local'
// convert dependabot/npm_and_yarn/dep-x.x.x to dependabot
).split('/')[0]);

/**
 * Use this to override the default dev docker image tag, if this
 * is set, using DEV_TAG is no longer needed
*/
export const DEV_DOCKER_IMAGE = process.env.DEV_DOCKER_IMAGE || undefined;

export const SKIP_E2E_OUTPUT_LOGS = toBoolean(process.env.SKIP_E2E_OUTPUT_LOGS ?? !isCI);

const reportCov = process.env.REPORT_COVERAGE || `${isCI}`;
export const REPORT_COVERAGE = toBoolean(reportCov);

export const JEST_MAX_WORKERS = process.env.JEST_MAX_WORKERS || undefined;

export const NPM_DEFAULT_REGISTRY = 'https://registry.npmjs.org/';
