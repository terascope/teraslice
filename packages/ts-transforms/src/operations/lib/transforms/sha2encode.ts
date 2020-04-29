import { DataEntity } from '@terascope/utils';
import crypto from 'crypto';
import { PostProcessConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class Sha2Encode extends TransformOpBase {
    hash: string;
    encode: (str: string) => string;
    constructor(config: PostProcessConfig) {
        super(config);
        this.hash = config.hash || 'sha256';
        this.encode = (data: string) => crypto
            .createHash(this.hash)
            .update(data)
            .digest('hex');
    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.encode);
    }
}
