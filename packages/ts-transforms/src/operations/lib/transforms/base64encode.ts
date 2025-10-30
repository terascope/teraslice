import { DataEntity } from '@terascope/core-utils';
import { PostProcessConfig } from '../../../interfaces.js';
import TransformOpBase from './base.js';

export default class Base64Encode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    encode(data: string) {
        return Buffer.from(data).toString('base64');
    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.encode);
    }
}
