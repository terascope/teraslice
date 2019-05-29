import { PostProcessConfig } from '../../../interfaces';
import ValidationOpBase from './base';

export default class Email extends ValidationOpBase<any> {
    private regex: RegExp;

    constructor(config: PostProcessConfig) {
        super(config);
        // Email Validation as per RFC2822 standards. Straight from .net helpfiles
        // tslint:disable-next-line: max-line-length
        this.regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;
    }

    validate(data: string) {
        if (typeof data !== 'string' || !data.toLowerCase().match(this.regex)) return false;
        return true;
    }
}
