import {
    DataWindow, AnyObject, BatchProcessor, DataEntity
} from '@terascope/job-components';

export default class TestProcessor extends BatchProcessor<AnyObject> {
    async onBatch(data: DataWindow): Promise<DataWindow> {
        return data.map((obj: DataEntity<any, any>) => obj.getMetadata('test'));
    }
}
