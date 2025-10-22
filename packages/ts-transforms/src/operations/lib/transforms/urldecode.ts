import { DataEntity } from '@terascope/core-utils';
import TransformOpBase from './base.js';
import { PostProcessConfig } from '../../../interfaces.js';

export default class UrlDecode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    decode(data: string) {
        return decodeURIComponent(data);
    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.decode);
    }
}
