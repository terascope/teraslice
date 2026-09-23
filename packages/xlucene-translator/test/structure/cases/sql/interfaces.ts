import { TranslatorOptions } from '../../../../src/translator/interfaces.js';

export type SQLTestCase = [
    // when given %s
    string,
    // the expected SQL expression
    string,
    // optional translator options - variables, filterNilVariables, a type config of its own
    TranslatorOptions?
];
