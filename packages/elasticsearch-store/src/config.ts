import { PRetryConfig } from '@terascope/utils';
import { normalizeError } from './utils';

const isTestMode = process.env.NODE_ENV === 'test';

export const MAX_RETRIES = isTestMode ? 2 : 100;
export const RETRY_DELAY = isTestMode ? 50 : 500;

export function getRetryConfig(): PRetryConfig {
    return {
        retries: MAX_RETRIES,
        delay: RETRY_DELAY,
        normalizeError,
    };
}
