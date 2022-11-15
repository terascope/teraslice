import {
    AnyQuery, ElasticsearchDSLResult, ElasticsearchDSLOptions
} from '@terascope/types';
import { TranslatorOptions } from '../../../src/translator/interfaces.js';

export type TestCase = [
    // when given %s
    string,
    // property in dot notation form
    string,
    // toHaveProperty($property, %j)
    AnyQuery|ElasticsearchDSLResult,
    // optional translator options
    TranslatorOptions?,
    // optional options to pass into toElasticsearchDSL
    ElasticsearchDSLOptions?
];
