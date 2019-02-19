
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import TransformOpBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class JsonParse extends TransformOpBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity {
        const field = _.get(doc, this.source);
        if (Array.isArray(field)) {
            const results: any[] = [];
            field.forEach((data) => {
                try {
                    const record = JSON.parse(data);
                    results.push(record);
                } catch (err) {}
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
