import net from 'net';
import ValidationOpBase from './base';
import { PostProcessConfig } from '../../../interfaces';

export default class Ip extends ValidationOpBase<any> {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    validate(data: string) {
        if (net.isIP(data) === 0) return false;
        return true;
    }
}
