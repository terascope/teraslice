
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import TransformBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class JsonParse extends TransformBase {
    constructor(config: OperationConfig) {
        super(config);
        // @ts-ignore
        this.config = config;
    }

    run(doc: DataEntity): DataEntity | null {
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
