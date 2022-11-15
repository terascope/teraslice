import { DataEntity } from '@terascope/utils';
import { OperationConfig, TransformOpBase, InputOutputCardinality } from '../../../src/index.js';

export default class Double extends TransformOpBase {
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity) {
        // @ts-expect-error
        const data = doc[this.source];
        if (data) doc[this.target as string] = data * 2;
        return doc;
    }
}
