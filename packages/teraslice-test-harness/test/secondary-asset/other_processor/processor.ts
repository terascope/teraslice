import { DataWindow, AnyObject, BatchProcessor } from '@terascope/job-components';

export default class OtherProcessor extends BatchProcessor<AnyObject> {
    async onBatch(data: DataWindow): Promise<DataWindow> {
        return data.map((obj) => {
            obj.setMetadata('other', true);
            return obj;
        });
    }
}
