
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import OperationBase from '../base';
import _ from 'lodash';

export default class Base64Decode extends OperationBase {
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
