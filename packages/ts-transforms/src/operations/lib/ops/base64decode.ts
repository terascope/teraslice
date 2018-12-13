
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import OperationBase from '../base'

export default class Base64Decode extends OperationBase { 
    constructor(config: OperationConfig) {
        super(config);
    }

    decoderFn(doc: DataEntity, data:string, target: string) {
        doc[target] = Buffer.from(data, 'base64').toString('utf8');
    }

    run(record: DataEntity): DataEntity | null {
        return this.decode(record, this.decoderFn)
    }
}