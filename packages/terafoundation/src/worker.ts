import type { Terafoundation } from '@terascope/types';

export default function workerModule(context: Terafoundation.Context): void {
    const { logger } = context;
    logger.info('Stub Worker.');
}
