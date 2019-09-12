
import { DataEntity } from '@terascope/utils';
import { PostProcessConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class Base64Encode extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    encode(data: string) {
        return Buffer.from(data).toString('base64');
    }

    run(record: DataEntity): DataEntity {
        return this.execute(record, this.encode);
    }
}
