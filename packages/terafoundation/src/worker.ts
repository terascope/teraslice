import { FoundationContext } from './interfaces';

export default function workerModule(context: FoundationContext) {
    const { logger } = context;
    logger.info('Stub Worker.');
}
