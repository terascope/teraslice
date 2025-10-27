import { DataEntity } from '@terascope/core-utils';
import { PostProcessConfig } from '../../../interfaces.js';
import TransformOpBase from './base.js';

export default class UrlEncode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    encode(data: string) {
        return encodeURIComponent(data);
    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.encode);
    }
}
