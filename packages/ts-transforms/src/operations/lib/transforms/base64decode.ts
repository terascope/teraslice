
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { OperationConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class Base64Decode extends TransformOpBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    decoderFn(data:string) {
        return Buffer.from(data, 'base64').toString('utf8');
    }

    run(record: DataEntity): DataEntity | null {
        return this.decode(record, this.decoderFn);
    }
}
