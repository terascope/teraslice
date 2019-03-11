
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

export default abstract class TransformOpBase extends OperationBase {

    constructor(config: OperationConfig) {
        super(config);
    }

    protected decode(doc: DataEntity, decodeFn: Function) {
        try {
            const value = _.get(doc, this.source);
            if (Array.isArray(value)) {
                const dataArray = value;
                const results: string[] = [];
                dataArray.forEach((str) => {
                    if (typeof str === 'string') {
                        try {
                            const decodedValue = decodeFn(str);
                            results.push(decodedValue);
                        } catch (err) {}
                    }
                });
                if (results.length === 0) {
                    this.removeSource(doc);
                } else {
                    this.set(doc, results);
                }
            } else {
                if (typeof value !== 'string') {
                    this.removeSource(doc);
                } else {
                    this.set(doc, decodeFn(value));
                }
            }
        } catch (err) {
            this.removeSource(doc);
        }
        return doc;
    }

    abstract run(data: DataEntity): null | DataEntity;
}
