
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import OperationBase from '../base';

export default abstract class ValidationOpBase<T> extends OperationBase {
    private invert: boolean;
    // @ts-ignore
    constructor(config) {
        super(config);
        this.invert = this.config.output === false;
    }

    abstract validate (data: T|null|undefined): boolean;

    normalize? (data: any, _doc: DataEntity): any;

    run(doc: DataEntity): DataEntity | null {
        let value;
        if (Array.isArray(this.source)) {
            value = this.source.map((field) => _.get(doc, field));
        } else {
            value = _.get(doc, this.source);
        }
        let isValid = false;

        if (value === undefined) {
            this.removeSource(doc);
            return doc;
        }

        try {
            if (Array.isArray(value)) {
                let dataArray = value;
                if (this.normalize && _.isFunction(this.normalize)) {
                    const normalizedResults: any[] = [];
                    dataArray.forEach((data) => {
                        try {
                            normalizedResults.push(this.normalize!(data, doc));
                        } catch (err) {
                            // do nothing
                        }
                    });
                    dataArray = normalizedResults;
                }
                const results = dataArray.filter((item) => {
                    if (this.invert) return !this.validate(item);
                    return this.validate(item);
                });
                if (results.length === 0) {
                    this.removeSource(doc);
                } else {
                    this.set(doc, results);
                }
            } else {
                if (this.normalize != null) value = this.normalize(value, doc);
                isValid = this.validate(value);
                // if output is false we invert the validation
                if (this.invert) isValid = !isValid;
                if (isValid) {
                    this.set(doc, value);
                } else {
                    this.removeSource(doc);
                }
            }
        } catch (err) {
            this.removeSource(doc);
        }

        return doc;
    }
}
