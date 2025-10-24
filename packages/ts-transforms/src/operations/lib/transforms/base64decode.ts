import { DataEntity } from '@terascope/entity-utils';
import { PostProcessConfig } from '../../../interfaces.js';
import TransformOpBase from './base.js';

export default class Base64Decode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    decode(data: string) {
        return Buffer.from(data, 'base64').toString('utf8');
    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.decode);
    }
}
