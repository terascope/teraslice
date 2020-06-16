import { FoundationContext } from './interfaces';

export default function workerModule(context: FoundationContext): void {
    const { logger } = context;
    logger.info('Stub Worker.');
}
