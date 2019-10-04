import isCI from 'is-ci';
import { address } from 'ip';
import { toBoolean } from '@terascope/utils';

export const FORCE_COLOR = process.env.FORCE_COLOR || '1';
export const HOST_IP = process.env.HOST_IP || address();
export const USE_EXISTING_SERVICES = toBoolean(process.env.USE_EXISTING_SERVICES);
export const SERVICE_HEAP_OPTS = process.env.SERVICE_HEAP_OPTS || '-Xms256m -Xmx256m';
export const USE_SERVICE_NETWORK = process.env.USE_SERVICE_NETWORK || undefined;
export const TEST_NAMESPACE = process.env.TEST_NAMESPACE || 'ts_test';

export const ELASTICSEARCH_NAME = process.env.ELASTICSEARCH_NAME || 'elasticsearch';
export const ELASTICSEARCH_HOSTNAME = process.env.ELASTICSEARCH_HOSTNAME || HOST_IP;
export const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || '49200';
export const ELASTICSEARCH_HOST = `http://${ELASTICSEARCH_HOSTNAME}:${ELASTICSEARCH_PORT}`;
export const ELASTICSEARCH_VERSION = process.env.ELASTICSEARCH_VERSION || '6.8';
export const ELASTICSEARCH_API_VERSION = process.env.ELASTICSEARCH_API_VERSION || '6.5';
export const ELASTICSEARCH_DOCKER_IMAGE = process.env.ELASTICSEARCH_DOCKER_IMAGE || 'blacktop/elasticsearch';

export const KAFKA_NAME = process.env.KAFKA_NAME || 'kafka';
export const KAFKA_HOSTNAME = process.env.KAFKA_HOSTNAME || HOST_IP;
export const KAFKA_PORT = process.env.KAFKA_PORT || '49092';
export const KAFKA_BROKER = `${KAFKA_HOSTNAME}:${KAFKA_PORT}`;
export const KAFKA_VERSION = process.env.KAFKA_VERSION || '2.1';
export const KAFKA_DOCKER_IMAGE = process.env.KAFKA_DOCKER_IMAGE || 'blacktop/kafka';

const reportCov = process.env.REPORT_COVERAGE;
export const REPORT_COVERAGE = reportCov != null || reportCov !== ''
    ? toBoolean(reportCov)
    : isCI;

export const JEST_MAX_WORKERS = process.env.JEST_MAX_WORKERS || undefined;

export const NPM_DEFAULT_REGISTRY = 'https://registry.npmjs.org/';
export const NPM_PUBLISH_TAG = process.env.NPM_PUBLISH_TAG || 'latest';
