import isIP from 'is-ip';
import ValidationOpBase from './base';
import { PostProcessConfig } from '../../../interfaces';

export default class IP extends ValidationOpBase<any> {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    validate(data: string): boolean {
        return isIP(data);
    }
}
