
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { PostProcessConfig } from '../../../interfaces';
import TransformOpBase from './base';

export default class Lowercase extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (typeof field === 'string') {
            this.set(doc, field.toLowerCase());
        } else if (Array.isArray(field)) {
            const results: string[] = [];
            field.forEach((str) => {
                if (typeof str === 'string') {
                    results.push(str.toLowerCase());
                }
            });
            if (results.length === 0) {
                this.removeSource(doc);
            } else {
                this.set(doc, results);
            }
        } else {
            this.removeSource(doc);
        }
        return doc;
    }
}
