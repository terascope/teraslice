import { AnyQuery, TranslatorOptions, ElasticsearchDSLResult } from '../../../src';

export type TestCase = [
    // when given %s
    string,
    // property in dot notation form
    string,
    // toHaveProperty($property, %j)
    AnyQuery|ElasticsearchDSLResult,
    // optional translator options
    TranslatorOptions?
];
