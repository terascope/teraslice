
import { DataEntity } from '@terascope/job-components';
import _ from 'lodash';
import querystring from 'querystring';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

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
