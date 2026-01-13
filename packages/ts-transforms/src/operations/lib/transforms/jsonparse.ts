import { get, DataEntity } from '@terascope/core-utils';
import TransformOpBase from './base.js';
import { PostProcessConfig } from '../../../interfaces.js';

export default class JsonParse extends TransformOpBase {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity {
        const field = get(doc, this.source);
        if (Array.isArray(field)) {
            const results: any[] = [];
            field.forEach((data) => {
                try {
                    const record = JSON.parse(data);
                    results.push(record);
                } catch (err) {
                    // do nothing
                }
            });
            if (results.length === 0) {
                this.removeSource(doc);
            } else {
                this.set(doc, results);
            }
            return doc;
        }
        try {
            const json = JSON.parse(field);
            this.set(doc, json);
        } catch (err) {
            this.removeSource(doc);
        }
        return doc;
    }
}
