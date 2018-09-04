'use strict';

const _ = require('lodash');

function safeEncode(obj) {
    let str;
    if (_.isString(obj)) {
        str = obj;
    } else if (_.isObjectLike(obj)) {
        str = JSON.stringify(obj);
    }
    return Buffer.from(str).toString('base64');
}

function safeDecode(str) {
    if (!_.isString(str) && _.isObjectLike(str)) {
        return str;
    }
    try {
        const parsed = JSON.parse(str);
        return Buffer.from(parsed, 'base64').toString('utf-8');
    } catch (err) {
        throw new Error(`Unable to decode ${str}`);
    }
}

module.exports = {
    safeEncode,
    safeDecode
};
