
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';
import OperationBase from '../base';
import querystring from 'querystring';

export default class UrlDecode extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    decoderFn(data:string) {
        return querystring.unescape(data);
    }

    run(record: DataEntity): DataEntity | null {
        return this.decode(record, this.decoderFn);
    }
}
