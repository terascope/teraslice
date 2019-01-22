
import _ from 'lodash';
import { OperationConfig, BoolValidationResult } from '../../../interfaces';
import ValidationBase from './base';

export default class BooleanValidation extends ValidationBase<any> {
    constructor(config: OperationConfig) {
        super(config);
    }

    validateBoolean(field: string | number | undefined): BoolValidationResult {
        if (field === undefined) return { isValid: false };
        if (_.isBoolean(field)) return { isValid: true, bool: field };
        if (field === 'true' || field === '1' || field === 1) return { isValid: true, bool: true };
        if (field === 'false' || field === '0' || field === 0) return { isValid: true, bool: false };
        return { isValid: false };
    }

    validate(data: string) {
        const { isValid } = this.validateBoolean(data);
        return isValid;
    }

    normalize(data: any) {
        const { bool } = this.validateBoolean(data);
        if (bool !== undefined) return bool;
        throw Error('could not normalize');
    }
}
