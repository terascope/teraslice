import isCI from 'is-ci';
import { address } from 'ip';
import { toBoolean } from '@terascope/utils';

export const HOST_IP = address();
export const ELASTICSEARCH_HOST = process.env.ELASTICSEARCH_HOST || `http://${HOST_IP}:49200`;
export const KAFKA_BROKER = process.env.KAFKA_BROKER || `${HOST_IP}:49092`;

const reportCov = process.env.REPORT_COVERAGE;
export const REPORT_COVERAGE = reportCov != null || reportCov !== ''
    ? toBoolean(reportCov)
    : isCI;
