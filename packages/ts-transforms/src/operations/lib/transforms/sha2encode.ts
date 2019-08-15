
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
        this.encode = (data:string) => {
                    // @ts-ignore
            return crypto.createHash(this.hash).update(data).digest('utf8');
        };
    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.encode);
    }
}
