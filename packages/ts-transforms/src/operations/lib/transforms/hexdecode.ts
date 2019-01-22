
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { OperationConfig } from '../../../interfaces';
import TransformBase from './base';

export default class HexDecode extends TransformBase {
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
