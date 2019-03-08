
import { DataEntity } from '@terascope/utils';
import { OperationConfig, TransformOpBase, InputOutputCardinality } from '../../../src';

export default class Double extends TransformOpBase {
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity) {
        // @ts-ignore
        doc[this.source] = doc[this.source] * 2;
        return doc;
    }
}
