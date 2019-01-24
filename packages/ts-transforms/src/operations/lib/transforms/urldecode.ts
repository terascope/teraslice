
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import querystring from 'querystring';
import TransformOpBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class UrlDecode extends TransformOpBase {
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
