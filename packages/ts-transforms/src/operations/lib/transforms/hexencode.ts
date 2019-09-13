
import { DataEntity } from '@terascope/utils';
import { PostProcessConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class HexEncode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    encode(data: string) {
        return Buffer.from(data).toString('hex');
    }

    run(record: DataEntity): DataEntity {
        return this.execute(record, this.encode);
    }
}
