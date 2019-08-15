
import { DataEntity } from '@terascope/utils';
import crypto from 'crypto';
import { PostProcessConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class SHA1Encode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    encode(data:string) {
        // @ts-ignore
        return crypto.createHash('sha1').update(data).digest('utf8');

    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.encode);
    }
}
