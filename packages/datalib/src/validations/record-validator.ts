import { AnyObject } from '@terascope/utils';
import { Repository } from '../interfaces';

export const respoitory: Repository = {
    required: { fn: required, config: { fields: { type: 'String[]!' } } },
};

export function required(obj: AnyObject, fields: string[]) {
    const keys = Object.keys(obj);
    return fields.every((rField) => keys.includes(rField));
}

// export function filter() {
//     return documentMatcher.match(doc)
// }
