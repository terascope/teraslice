
import { DataEntity } from '@terascope/utils';
import { OperationConfig, TransformOpBase, InputOutputCardinality } from '../../../src';

export default class Double extends TransformOpBase {
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity) {
        // @ts-ignore
        const data = doc[this.source];
        if (data) doc[this.target as string] = data * 2;
        return doc;
    }
}
