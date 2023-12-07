import {
    AnyObject, isString, isObjectEntity,
    getTypeOf, isArrayLike
} from '@terascope/utils';

export function safeEncode(obj: string | AnyObject) {
    let str: string;
    if (isString(obj)) {
        str = obj;
    } else if (isObjectEntity(obj) || isArrayLike(obj)) {
        str = JSON.stringify(obj);
    } else {
        throw new Error(`unprocessable entity to encode: ${getTypeOf(obj)}`);
    }
    return Buffer.from(str).toString('base64');
}

// TODO: proper types for this
export function safeDecode(str: string | AnyObject) {
    if (!isString(str) && isObjectEntity(str)) {
        return str;
    }
    try {
        return JSON.parse(Buffer.from(str as string, 'base64').toString('utf-8'));
    } catch (err) {
        throw new Error(`Unable to decode ${str}`);
    }
}
