import { isIP } from '@terascope/core-utils';
import ValidationOpBase from './base.js';
import { PostProcessConfig } from '../../../interfaces.js';

export default class IP extends ValidationOpBase<any> {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    validate(data: string): boolean {
        return isIP(data);
    }
}
