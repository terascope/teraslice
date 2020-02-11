import { AnyObject } from '@terascope/utils';
import { Repository } from '../interfaces';

export const respoitory: Repository = {
    required: {
        fn: required,
        config: {
            fields: {
                type: 'String',
                array: true
            }
        }
    },
};

export function required(obj: AnyObject, fields: string[]) {
    const keys = Object.keys(obj);
    return fields.every((rField) => keys.includes(rField));
}

// filter on field value

// export function filter() {
//     return documentMatcher.match(doc)
// }
