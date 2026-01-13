import { get, DataEntity } from '@terascope/core-utils';
import { PostProcessConfig } from '../../../interfaces.js';
import TransformOpBase from './base.js';

export default class Uppercase extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity | null {
        const field = get(doc, this.source);
        if (typeof field === 'string') {
            this.set(doc, field.toUpperCase());
        } else if (Array.isArray(field)) {
            const results: string[] = [];
            field.forEach((str) => {
                if (typeof str === 'string') {
                    results.push(str.toUpperCase());
                }
            });
            if (results.length === 0) {
                this.removeSource(doc);
            } else {
                this.set(doc, results);
            }
        } else {
            this.removeSource(doc);
            if (Object.keys(doc).length === 0) return null;
        }
        return doc;
    }
}
