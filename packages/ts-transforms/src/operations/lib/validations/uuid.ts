import validator from 'validator';
import ValidationOpBase from './base';
import { PostProcessConfig } from '../../../interfaces';

export default class Uuid extends ValidationOpBase<any> {
    private case: 'lowercase' | 'uppercase';

    constructor(config: PostProcessConfig) {
        super(config);
        this.case = config.case || 'lowercase';
    }

    normalize(doc: any) {
        if (typeof doc !== 'string') throw new Error('field must be a string');
        let results = doc;
        if (this.case === 'lowercase') results = results.toLowerCase();
        if (this.case === 'uppercase') results = results.toUpperCase();
        return results;
    }

    validate(value: string) {
        if (!validator.isUUID(value)) return false;
        return true;
    }
}
