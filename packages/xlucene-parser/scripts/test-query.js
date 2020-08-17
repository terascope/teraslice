'use strict';

const { toXluceneQuery } = require('@terascope/data-mate');
const { xLuceneFieldType } = require('@terascope/types');
const { Parser } = require('../dist/src');

console.time('toXluceneQuery');
const { query, variables } = toXluceneQuery({
    foo: 'bar',
    bar: 'baz',
    bool: true,
    num: 10000,
    name: 'Billy',
    age: 76
}, {
    typeConfig: {
        name: xLuceneFieldType.String,
        foo: xLuceneFieldType.String,
        bar: xLuceneFieldType.String,
        bool: xLuceneFieldType.Boolean,
        age: xLuceneFieldType.Integer,
        num: xLuceneFieldType.Integer,
    }
});
console.timeEnd('toXluceneQuery');

console.error({ query, variables });

console.time('parse');
new Parser(query, {
    variables
});
console.timeEnd('parse');
