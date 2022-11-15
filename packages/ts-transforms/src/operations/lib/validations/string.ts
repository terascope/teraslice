import validator from 'validator';;
import ValidationOpBase from './base.js';
import { PostProcessConfig } from '../../../interfaces.js';

export default class StringValidation extends ValidationOpBase<any> {
    private length?: number;
    private min?: number;
    private max?: number;

    constructor(config: PostProcessConfig) {
        super(config);
        this.length = config.length;
    }

    normalize(field: any) {
        let data;
        if (typeof field === 'string') {
            data = field;
        } else if (typeof field === 'object') {
            data = JSON.stringify(field);
        } else {
            data = field.toString();
        }

        if (this.length && data && data.length !== this.length) return null;

        if (this.min || this.max) {
            const min = this.min || 1;
            const max = this.max || Infinity;
            // wierd method name, it actually checks if it fits the range
            if (!validator.isLength(data, { min, max })) return null;
        }
        return data;
    }

    validate(data: string) {
        if (typeof data === 'string') return true;
        return false;
    }
}
