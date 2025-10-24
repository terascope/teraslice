import { get } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import OperationBase from '../base.js';

export default abstract class TransformOpBase extends OperationBase {
    protected execute(doc: DataEntity, fn: (value: any) => any): DataEntity | null {
        try {
            const value = get(doc, this.source);
            if (Array.isArray(value)) {
                const dataArray = value;
                const results: string[] = [];
                dataArray.forEach((str) => {
                    if (typeof str === 'string') {
                        try {
                            const decodedValue = fn(str);
                            results.push(decodedValue);
                        } catch (err) {
                            // do nothing
                        }
                    }
                });
                if (results.length === 0) {
                    this.removeSource(doc);
                    if (Object.keys(doc).length === 0) return null;
                } else {
                    this.set(doc, results);
                }
            } else if (typeof value !== 'string') {
                this.removeSource(doc);
                if (Object.keys(doc).length === 0) return null;
            } else {
                const mystuff = fn(value);
                this.set(doc, mystuff);
            }
        } catch (err) {
            this.removeSource(doc);
            if (Object.keys(doc).length === 0) return null;
        }

        return doc;
    }

    abstract run(data: DataEntity): null | DataEntity;
}
