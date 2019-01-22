
import _ from 'lodash';
import net from 'net';
import ValidationBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class Ip extends ValidationBase<any> {
    constructor(config: OperationConfig) {
        super(config);
    }

    validate(data: string) {
        if (net.isIP(data) === 0) return false;
        return true;
    }

}
