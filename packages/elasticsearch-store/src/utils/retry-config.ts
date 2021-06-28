import { PRetryConfig, isTest } from '@terascope/utils';

export const MAX_RETRIES = isTest ? 2 : 100;
export const RETRY_DELAY = isTest ? 50 : 500;

export function getRetryConfig(): Partial<PRetryConfig> {
    return {
        retries: MAX_RETRIES,
        delay: RETRY_DELAY,
        matches: [
            'node_disconnect_exception',
            'es_rejected_execution_exception',
            'No Living connections'
        ],
    };
}
