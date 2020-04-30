import { DataEntity } from '@terascope/utils';
import crypto from 'crypto';
import { PostProcessConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class SHA1Encode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    encode(data: string) {
        return crypto.createHash('sha1').update(data).digest('hex');
    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.encode);
    }
}
