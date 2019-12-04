
import { DataEntity } from '@terascope/utils';
import TransformOpBase from './base';
import { PostProcessConfig } from '../../../interfaces';

export default class UrlDecode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    decode(data: string) {
        return decodeURIComponent(data);
    }

    run(record: DataEntity): DataEntity {
        return this.execute(record, this.decode);
    }
}
