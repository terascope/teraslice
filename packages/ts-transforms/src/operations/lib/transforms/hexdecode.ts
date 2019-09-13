
import { DataEntity } from '@terascope/utils';
import { PostProcessConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class HexDecode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    decode(data: string) {
        return Buffer.from(data, 'hex').toString('utf8');
    }

    run(record: DataEntity): DataEntity {
        return this.execute(record, this.decode);
    }
}
