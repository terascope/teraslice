import { Operation } from './operation';

/**
 * FetchOperation Base Class [DRAFT]
 */

export class FetchOperation extends Operation {
    public async fetch(startingData?: any): Promise<any[]> {
        this.logger.debug('read got starting data', startingData);
        return [];
    }
}
