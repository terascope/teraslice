
import { DataEntity } from '@terascope/utils';
import _ from 'lodash';
import validator from 'validator';
import ValidationOpBase from './base';
import { OperationConfig } from '../../../interfaces';

export default class MacAddress extends ValidationOpBase<any> {
    private case: 'lowercase' | 'uppercase';
    private preserveColons: boolean;

    constructor(config: OperationConfig) {
        super(config);
        this.case = config.case || 'lowercase';
        this.preserveColons = config.preserve_colons || false;
    }

    normalize(data: any, _doc: DataEntity) {
        let results = data;
        if (typeof data !== 'string') throw new Error('data must be a string');
        if (this.case === 'lowercase') results = results.toLowerCase();
        if (this.case === 'uppercase') results = results.toUpperCase();
        if (!this.preserveColons) results = results.replace(/:/gi, '');
        return results;
    }

    validate(data: string) {
        const options = { no_colons: !this.preserveColons };
        // TODO: fix the types for valdiator, it does not have the options listed
        // @ts-ignore
        if (!validator.isMACAddress(data, options)) return false;
        return true;
    }
}
