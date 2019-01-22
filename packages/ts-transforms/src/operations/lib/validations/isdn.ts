
import _ from 'lodash';
import PhoneValidator from 'awesome-phonenumber';
import ValidationBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class ISDN extends ValidationBase<any> {
    constructor(config: OperationConfig) {
        super(config);
    }

    validate(value: string) {
        if (!new PhoneValidator(`+${value}`).isValid()) return false;
        return true;
    }
}
