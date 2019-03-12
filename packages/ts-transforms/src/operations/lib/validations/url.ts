
import _ from 'lodash';
import { DataEntity } from '@terascope/utils';
import * as url from 'valid-url';
import { PostProcessConfig } from '../../../interfaces';
import ValidationOpBase from './base';

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
