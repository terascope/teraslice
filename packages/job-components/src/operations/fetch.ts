import { DataEntity } from './data-entity';
import { Operation } from './operation';

/**
 * FetchOperation Base Class [DRAFT]
 */

export class FetchOperation extends Operation {
    public async fetch(startingData?: any): Promise<DataEntity[]> {
        this.logger.debug('read got starting data', startingData);
        return [];
    }
}
