import { DataEntity } from '@terascope/job-components';
import _ from 'lodash';
import PhoneValidator from 'awesome-phonenumber';
import OperationBase from '../base';
import { OperationConfig } from '../../../interfaces';

export default class PhoneNumber extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    run(doc: DataEntity): DataEntity | null {
        const value = _.get(doc, this.source);
        if (!new PhoneValidator(`+${value}`).isValid()) _.unset(doc, this.source);
        return doc;
    }
}
