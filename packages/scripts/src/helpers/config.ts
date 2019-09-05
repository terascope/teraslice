import isCI from 'is-ci';
import { address } from 'ip';
import { toBoolean } from '@terascope/utils';

export const HOST_IP = address();
export const USE_EXISTING_SERVICES = toBoolean(process.env.USE_EXISTING_SERVICES);

export const ELASTICSEARCH_HOST = process.env.ELASTICSEARCH_HOST || `http://${HOST_IP}:49200`;
export const ELASTICSEARCH_VERSION = process.env.ELASTICSEARCH_VERSION || '6.8';
export const ELASTICSEARCH_API_VERSION = process.env.ELASTICSEARCH_API_VERSION || '6.5';

export const KAFKA_BROKER = process.env.KAFKA_BROKER || `${HOST_IP}:49092`;
export const KAFKA_VERSION = process.env.KAFKA_VERSION || '2.1';

const reportCov = process.env.REPORT_COVERAGE;
export const REPORT_COVERAGE = reportCov != null || reportCov !== ''
    ? toBoolean(reportCov)
    : isCI;

export const NPM_DEFAULT_REGISTRY = 'https://registry.npmjs.org/';
