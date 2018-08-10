'use strict';

const _ = require('lodash');
const nanoid = require('nanoid/generate');

function newId(prefix, lowerCase = false, length = 15) {
    let characters = '-0123456789abcdefghijklmnopqrstuvwxyz';
    if (!lowerCase) {
        characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    let id = _.trim(nanoid(characters, length), '-');
    id = _.padEnd(id, length, 'abcdefghijklmnopqrstuvwxyz');
    if (prefix) {
        return `${prefix}-${id}`;
    }
    return id;
}

module.exports = newId;
