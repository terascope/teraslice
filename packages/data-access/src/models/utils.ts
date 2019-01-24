import { cloneDeep, isPlainObject, uniq } from '@terascope/utils';

export function addDefaults(source: object, from: object = {}) {
    const output = cloneDeep(source);
    const _mapping = cloneDeep(from);

    for (const [key, val] of Object.entries(_mapping)) {
        if (output[key] != null) {
            if (isPlainObject(val)) {
                output[key] = Object.assign(output[key], val);
            } else if (Array.isArray(val)) {
                output[key] = uniq(output[key].concat(val));
            } else {
                output[key] = val;
            }
        }
    }

    return output;
}
