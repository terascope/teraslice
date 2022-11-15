import { DataEntity } from '@terascope/utils';
import { OperationConfig, InputOutputCardinality } from '../../../src/index.js';

export default class NoOp {
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(operationConfig: OperationConfig) {
        // @ts-expect-error
        this.operationConfig = operationConfig;
    }

    run(doc: DataEntity) {
        return doc;
    }
}
