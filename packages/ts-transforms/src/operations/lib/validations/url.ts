
import _ from 'lodash';
import * as url from 'valid-url';
import { OperationConfig } from '../../../interfaces';
import ValidationBase from './base';

export default class Url extends ValidationBase<any> {
    constructor(config: OperationConfig) {
        super(config);
    }

    validate(doc: any) {
        if (typeof doc !== 'string' || !url.isUri(doc)) return false;
        return true;
    }
}
