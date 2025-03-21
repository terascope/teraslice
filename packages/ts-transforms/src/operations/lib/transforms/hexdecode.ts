import { DataEntity } from '@terascope/utils';
import { PostProcessConfig } from '../../../interfaces.js';
import TransformOpBase from './base.js';

export default class HexDecode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    decode(data: string) {
        return Buffer.from(data, 'hex').toString('utf8');
    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.decode);
    }
}
