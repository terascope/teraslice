import { DataEntity } from '@terascope/entity-utils';
import url from 'valid-url';
import { PostProcessConfig } from '../../../interfaces.js';
import ValidationOpBase from './base.js';

export default class Url extends ValidationOpBase<any> {
    constructor(config: PostProcessConfig) {
        super(config);
    }

    normalize(data: any, _doc: DataEntity) {
        if (typeof data === 'string') return data.trim();
        throw new Error('could not convert the url');
    }

    validate(doc: any) {
        if (typeof doc !== 'string' || !url.isUri(doc)) return false;
        return true;
    }
}
