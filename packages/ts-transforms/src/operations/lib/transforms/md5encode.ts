import { DataEntity } from '@terascope/entity-utils';
import crypto from 'crypto';
import { PostProcessConfig } from '../../../interfaces.js';
import TransformOpBase from './base.js';

export default class MD5Encode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    encode(data: string) {
        return crypto.createHash('md5').update(data)
            .digest('hex');
    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.encode);
    }
}
