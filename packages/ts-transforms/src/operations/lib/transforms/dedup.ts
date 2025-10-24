import { get, uniq } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import TransformOpBase from './base.js';
import { PostProcessConfig } from '../../../interfaces.js';

export default class Dedup extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity {
        const arrayField = get(doc, this.source);
        if (Array.isArray(arrayField)) {
            this.set(doc, uniq(arrayField));
            return doc;
        }
        return doc;
    }
}
