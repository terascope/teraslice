import { TerasliceOperation } from './operation';

export class FetchOperation extends TerasliceOperation {
    public async fetch(startingData?: any): Promise<any[]> {
        this.logger.debug('read got starting data', startingData);
        return [];
    }
}
