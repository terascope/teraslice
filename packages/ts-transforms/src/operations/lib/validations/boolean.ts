import { isBoolean } from '@terascope/core-utils';
import { PostProcessConfig, BoolValidationResult } from '../../../interfaces.js';
import ValidationOpBase from './base.js';

export default class BooleanValidation extends ValidationOpBase<any> {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    validateBoolean(field: any): BoolValidationResult {
        if (field === undefined) return { isValid: false };
        if (isBoolean(field)) return { isValid: true, bool: field };
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
