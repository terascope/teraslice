import { DataEntity } from './data-entity';
import { OperationCore } from './operation-core';

/**
 * Fetcher Base Class [DRAFT]
 * @description A core operation for fetching the data pushing it into the job pipeline.
 *              The "Fetcher" is a part of the "Reader" component of a job.
 */

export class Fetcher extends OperationCore {
    async fetch(startingData?: any): Promise<DataEntity[]> {
        this.logger.debug(`startingData ${startingData}`);
        throw new Error('Fetcher must implement a "fetch" method');
    }
}
