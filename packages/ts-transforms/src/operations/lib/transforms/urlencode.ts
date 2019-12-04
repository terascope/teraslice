
import { DataEntity } from '@terascope/utils';
import { PostProcessConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class UrlEncode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    encode(data: string) {
        return encodeURIComponent(data);
    }

    run(record: DataEntity): DataEntity {
        return this.execute(record, this.encode);
    }
}
