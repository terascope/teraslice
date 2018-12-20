
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';
import OperationBase from '../base';

export default class Boolean extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (!_.isBoolean(field) && field !== 'true' && field !== 'false') _.unset(doc, this.source);
        return doc;
    }
}
