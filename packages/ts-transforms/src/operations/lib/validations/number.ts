
import { DataEntity } from '@terascope/job-components';
import { OperationConfig } from '../../../interfaces';
import _ from 'lodash';
import OperationBase from '../base';

export default class NumberValidation extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        if (!(typeof field === 'string' || typeof field === 'number') || _.isNaN(_.toNumber(field))) _.unset(doc, this.source);
        return doc;
    }
}
