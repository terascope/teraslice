
import _ from 'lodash';
import { DataEntity } from '@terascope/job-components';
import { OperationConfig, BoolValidation } from '../../../interfaces';
import OperationBase from '../base';

export default class BooleanValidation extends OperationBase {
    constructor(config: OperationConfig) {
        super(config);
    }

    validateBoolean(field: string | number | undefined): BoolValidation {
        if (field === undefined) return { isValid: false };
        if (_.isBoolean(field)) return { isValid: true, bool: field };
        if (field === 'true' || field === '1' || field === 1) return { isValid: true, bool: true };
        if (field === 'false' || field === '0' || field === 0) return { isValid: true, bool: false };
        return { isValid: false };
    }

    run(doc: DataEntity): DataEntity | null {
        const field = _.get(doc, this.source);
        const { isValid, bool } = this.validateBoolean(field);
        if (!isValid) {
            _.unset(doc, this.source);
            return doc;
        }
        _.set(doc, this.source, bool);
        return doc;
    }
}
