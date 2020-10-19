/* eslint-disable no-console */

'use strict';

const { xLuceneFieldType } = require('@terascope/types');
const { Parser } = require('../dist/src');

console.time('parse');
const { ast } = new Parser('name:(foo bar)', {
    type_config: {
        name: xLuceneFieldType.String,
        foo: xLuceneFieldType.String,
        bar: xLuceneFieldType.String,
        bool: xLuceneFieldType.Boolean,
        age: xLuceneFieldType.Integer,
        num: xLuceneFieldType.Integer,
    }
});
console.timeEnd('parse');

console.dir(ast);
