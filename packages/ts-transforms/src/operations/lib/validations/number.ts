
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import { PostProcessConfig } from '../../../interfaces';
import ValidationOpBase from './base';

export default class NumberValidation extends ValidationOpBase<any> {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    normalize(data: any, _doc: DataEntity) {
        if (typeof data === 'number') return data;
        if (typeof data === 'string') {
            const results = _.toNumber(data);
            if (_.isNaN(results)) throw new Error('could not convert to a number');
            return results;
        }
        throw new Error('could not convert to a number');
    }

    validate(data:number) {
        if (typeof data === 'number') return true;
        return false;
    }
}
