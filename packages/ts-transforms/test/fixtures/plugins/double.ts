
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../src/interfaces';
import OperationBase from '../../../src/operations/lib/base';

export default class Double extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity) {
        doc[this.source] = doc[this.source] * 2;
        return doc;
    }
}
