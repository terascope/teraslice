
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';
import OperationBase from '../base';

export default class HexDecode extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    decoderFn(data:string) {
        return Buffer.from(data, 'hex').toString('utf8');
    }

    run(record: DataEntity): DataEntity | null {
        return this.decode(record, this.decoderFn);
    }
}
