
import { DataEntity } from '@terascope/utils';
import { OperationConfig } from '../../../src/interfaces';
import TransformBase from '../../../src/operations/lib/transforms/base';

export default class Double extends TransformBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity) {
        doc[this.source] = doc[this.source] * 2;
        return doc;
    }
}
