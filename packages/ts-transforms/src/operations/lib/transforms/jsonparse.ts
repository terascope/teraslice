
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
        try {
            const json = JSON.parse(field);
            _.set(doc, this.target, json);
            _.unset(doc, this.source);
        } catch (err) {
            _.unset(doc, this.source);
        }
        return doc;
    }
}
