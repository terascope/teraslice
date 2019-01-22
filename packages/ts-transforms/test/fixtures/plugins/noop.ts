
import { DataEntity } from '@terascope/utils';
import { OperationConfig } from '../../../src/interfaces';

export default class NoOp {
    constructor(operationConfig: OperationConfig) {
        // @ts-ignore
        this.operationConfig = operationConfig;
    }

    run(doc: DataEntity) {
        return doc;
    }
}
