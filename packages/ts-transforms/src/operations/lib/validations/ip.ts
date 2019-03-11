
import _ from 'lodash';
import net from 'net';
import ValidationOpBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class Ip extends ValidationOpBase<any> {
    constructor(config: OperationConfig) {
        super(config);
    }

    validate(data: string) {
        if (net.isIP(data) === 0) return false;
        return true;
    }

}
