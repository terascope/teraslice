import { AnyObject } from '@terascope/utils';
import { Repository } from '../interfaces';

export const respoitory: Repository = {
    required: { fn: required, config: { fields: { type: 'String[]!' } } },
};

export function required(obj: AnyObject, fields: string[]) {
    const keys = Object.keys(obj);
    const hasKeys = fields.every((rField) => keys.includes(rField));
    if (hasKeys) return obj;
    // return null or {}
    return null;
}

export function filter() {
    return documentMatcher.match(doc)
}
