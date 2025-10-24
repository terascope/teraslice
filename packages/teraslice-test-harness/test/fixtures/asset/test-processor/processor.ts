import { BatchProcessor } from '@terascope/job-components';
import { DataEntity } from '@terascope/entity-utils';

export default class TestProcessor extends BatchProcessor<Record<string, any>> {
    async onBatch(data: DataEntity[]): Promise<DataEntity<Record<string, any>>[]> {
        return data.map((obj) => obj.getMetadata('test'));
    }
}
