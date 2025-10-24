import { toNumber } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import { PostProcessConfig } from '../../../interfaces.js';
import ValidationOpBase from './base.js';

export default class NumberValidation extends ValidationOpBase<any> {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    normalize(data: any, _doc: DataEntity) {
        if (typeof data === 'number') return data;
        if (typeof data === 'string') {
            const results = toNumber(data);
            if (Number.isNaN(results)) throw new Error('could not convert to a number');
            return results;
        }
        throw new Error('could not convert to a number');
    }

    validate(data: number) {
        if (typeof data === 'number') return true;
        return false;
    }
}
