
import { DataEntity } from '@terascope/utils';
import TransformOpBase from './base';
import { PostProcessConfig } from '../../../interfaces';

export default class UrlDecode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    decode(data: string) {
        return decodeURI(data);
    }

    run(record: DataEntity): DataEntity | null {
        return this.execute(record, this.decode);
    }
}
