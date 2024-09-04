import { BatchProcessor } from '@terascope/job-components';

export default class Example extends BatchProcessor {
    onBatch(dataArray) {
        // example code, processor code goes here
        dataArray.forEach((doc) => {
            doc.type = this.opConfig.type;
        });
        return dataArray;
    }
}
