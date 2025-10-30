import { DataEntity } from '@terascope/core-utils';
import { OperationConfig, InputOutputCardinality } from '../../../src';

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
