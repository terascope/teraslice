import _ from 'lodash';

export function safeEncode(obj) {
    let str;
    if (_.isString(obj)) {
        str = obj;
    } else if (_.isObjectLike(obj)) {
        str = JSON.stringify(obj);
    }
    return Buffer.from(str).toString('base64');
}

export function safeDecode(str) {
    if (!_.isString(str) && _.isObjectLike(str)) {
        return str;
    }
    try {
        return JSON.parse(Buffer.from(str, 'base64').toString('utf-8'));
    } catch (err) {
        throw new Error(`Unable to decode ${str}`);
    }
}
