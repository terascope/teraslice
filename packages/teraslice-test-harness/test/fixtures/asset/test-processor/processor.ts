import { DataEntity, AnyObject, BatchProcessor } from '@terascope/job-components';

export default class TestProcessor extends BatchProcessor<AnyObject> {
    async onBatch(data: DataEntity[]): Promise<DataEntity<Record<string, any>>[]> {
        return data.map((obj) => obj.getMetadata('test'));
    }
}
