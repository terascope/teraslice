import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import OperationBase from '../base';

export default abstract class TransformOpBase extends OperationBase {
    protected execute(doc: DataEntity, fn: Function) {
        try {
            const value = _.get(doc, this.source);
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
                } else {
                    this.set(doc, results);
                }
            } else if (typeof value !== 'string') {
                this.removeSource(doc);
            } else {
                const mystuff = fn(value);
                this.set(doc, mystuff);
            }
        } catch (err) {
            this.removeSource(doc);
        }
        return doc;
    }

    abstract run(data: DataEntity): null | DataEntity;
}
