
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import TransformOpBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class Dedup extends TransformOpBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity {
        const arrayField = _.get(doc, this.source);
        if (Array.isArray(arrayField)) {
            this.set(doc, _.uniq(arrayField));
            return doc;
        }
        return doc;
    }
}
