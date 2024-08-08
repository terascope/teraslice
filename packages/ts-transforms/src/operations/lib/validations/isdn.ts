import PhoneValidator from 'awesome-phonenumber';
import ValidationOpBase from './base.js';
import { PostProcessConfig } from '../../../interfaces.js';

export default class ISDN extends ValidationOpBase<any> {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    normalize(data: any) {
        const phoneNumber = new PhoneValidator(`+${data}`);
        const fullNumber = phoneNumber.getNumber();
        if (fullNumber) return String(fullNumber).slice(1);
        throw Error('could not normalize');
    }

    validate(value: string) {
        if (!new PhoneValidator(`+${value}`).isValid()) return false;
        return true;
    }
}
