import { AnyObject } from '@terascope/utils';
import { Repository } from '../interfaces';

export const respository: Repository = {
    required: { fn: required, config: { fields: { type: 'String[]!' } } },
};

export function required(obj: AnyObject, fields: string[]) {
    const keys = Object.keys(obj);
    return fields.every((rField) => keys.includes(rField));
}

//ilter on field value

// export function filter() {
//     return documentMatcher.match(doc)
// }
