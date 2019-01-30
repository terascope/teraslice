import { PRetryConfig } from '@terascope/utils';

const isTestMode = process.env.NODE_ENV === 'test';

export const MAX_RETRIES = isTestMode ? 2 : 100;
export const RETRY_DELAY = isTestMode ? 50 : 500;

export function getRetryConfig(): Partial<PRetryConfig> {
    return {
        retries: MAX_RETRIES,
        delay: RETRY_DELAY,
        matches: [
            'es_rejected_execution_exception'
        ]
    };
}
