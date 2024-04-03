import { FoundationContext } from './interfaces.js';

export default function workerModule(context: FoundationContext): void {
    const { logger } = context;
    logger.info('Stub Worker.');
}
