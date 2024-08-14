/* eslint-disable no-console */

import { xLuceneFieldType } from '@terascope/types';
import { Parser } from '../dist/src/index.js';

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
