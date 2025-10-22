import {
    DataEntity, get, isFunction, isNil
} from '@terascope/core-utils';
import OperationBase from '../base.js';
import { OperationConfig } from '../../../interfaces.js';

export default abstract class ValidationOpBase<T> extends OperationBase {
    private invert: boolean;
    constructor(config: OperationConfig) {
        super(config);
        this.invert = this.config.output === false;
    }

    abstract validate(data: T | null | undefined): boolean;

    normalize?(data: any, _doc: DataEntity): any;

    run(doc: DataEntity) {
        let value;

        if (Array.isArray(this.source)) {
            value = this.source.map((field) => get(doc, field));
        } else {
            value = get(doc, this.source);
        }

        let isValid = false;

        if (isNil(value)) {
            this.removeSource(doc);
            if (Object.keys(doc).length === 0) return null;

            return doc;
        }

        try {
            if (Array.isArray(value)) {
                let dataArray = value;
                if (this.normalize && isFunction(this.normalize)) {
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
                    if (Object.keys(doc).length === 0) return null;
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
                    if (Object.keys(doc).length === 0) return null;
                }
            }
        } catch (err) {
            this.removeSource(doc);
            if (Object.keys(doc).length === 0) return null;
        }

        return doc;
    }
}
