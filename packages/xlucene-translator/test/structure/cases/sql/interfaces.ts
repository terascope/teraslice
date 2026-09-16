import { xLuceneSQLOptions } from '@terascope/types';
import { TranslatorOptions } from '../../../../src/translator/interfaces.js';

export type SQLTestCase = [
    // when given %s
    string,
    // the expected SQL expression
    string,
    // optional translator options
    TranslatorOptions?,
    // optional options to pass into toSQL
    xLuceneSQLOptions?
];
