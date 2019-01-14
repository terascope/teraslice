
import validator from 'validator';
import _ from 'lodash';
import { DataEntity } from '@terascope/job-components';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

export default class Uuid extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (typeof field !== 'string') {
            _.unset(doc, this.source);
            return doc;
        }
        if (!validator.isUUID(field)) _.unset(doc, this.source);
        return doc;
    }
}
