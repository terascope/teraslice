
import { DataEntity } from '@terascope/utils';
import { PostProcessConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class UrlEncode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    encode(data:string) {
        return encodeURI(data);

    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.encode);
    }
}
