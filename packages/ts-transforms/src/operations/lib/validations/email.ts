
import _ from 'lodash';
import { OperationConfig } from '../../../interfaces';
import ValidationBase from './base';

export default class Email extends ValidationBase<any> {
    private regex: RegExp;

    constructor(config: OperationConfig) {
        super(config);
        // Email Validation as per RFC2822 standards. Straight from .net helpfiles
        this.regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;
    }

    validate(data: string) {
        if (typeof data !== 'string' || !data.match(this.regex)) return false;
        return true;
    }
}
