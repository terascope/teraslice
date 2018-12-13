
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';
import OperationBase from '../base';
import querystring from 'querystring';


export default class UrlDecode extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    decoderFn(doc: DataEntity, data:string, target: string) {
        doc[target] = querystring.unescape(data);
    }

    run(record: DataEntity): DataEntity | null {
        return this.decode(record, this.decoderFn)
    }
}