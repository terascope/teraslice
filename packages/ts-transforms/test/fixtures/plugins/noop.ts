
import { DataEntity } from '@terascope/utils';
import { OperationConfig, InputOutputCardinality } from '../../../src';

export default class NoOp {
    static cardinality: InputOutputCardinality = 'one-to-one';

    constructor(operationConfig: OperationConfig) {
        // @ts-ignore
        this.operationConfig = operationConfig;
    }

    run(doc: DataEntity) {
        return doc;
    }
}
