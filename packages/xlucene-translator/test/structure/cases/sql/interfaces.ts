import { TranslatorOptions } from '../../../../src/index.js';

export type SQLTestCase = [
    // when given %s
    string,
    // the expected SQL expression
    string,
    // optional translator options: variables, filterNilVariables, or its own type config
    TranslatorOptions?
];
