import { DataEntity } from '@terascope/entity-utils';
import validator from 'validator';
import ValidationOpBase from './base.js';
import { PostProcessConfig } from '../../../interfaces.js';

export default class MacAddress extends ValidationOpBase<any> {
    private case: 'lowercase' | 'uppercase';
    private preserveColons: boolean;

    constructor(config: PostProcessConfig) {
        super(config);
        this.case = config.case || 'lowercase';
        this.preserveColons = config.preserve_colons || false;
    }

    normalize(data: unknown, _doc: DataEntity): string {
        if (typeof data !== 'string') throw new Error('data must be a string');
        let results = data;
        if (this.case === 'lowercase') results = results.toLowerCase();
        if (this.case === 'uppercase') results = results.toUpperCase();
        if (!this.preserveColons) results = results.replace(/:/gi, '');
        return results;
    }

    validate(data: string): boolean {
        const options = { no_colons: !this.preserveColons };
        // TODO: fix the types for valdiator, it does not have the options listed
        if (!validator.isMACAddress(data, options)) return false;
        return true;
    }
}
