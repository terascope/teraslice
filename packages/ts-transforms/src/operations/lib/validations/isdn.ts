import { parsePhoneNumber } from 'awesome-phonenumber';
import ValidationOpBase from './base.js';
import { PostProcessConfig } from '../../../interfaces.js';

export default class ISDN extends ValidationOpBase<any> {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    normalize(data: any) {
        const phoneNumber = parsePhoneNumber(`+${data}`);
        const fullNumber = phoneNumber.number?.e164;
        if (fullNumber) return String(fullNumber).slice(1);
        throw Error('could not normalize');
    }

    validate(value: string) {
        if (!parsePhoneNumber(`+${value}`).valid) return false;
        return true;
    }
}
