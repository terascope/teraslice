import { TestCase } from './interfaces';

export default [
    ['hi:the?e', 'parse value with ? wildcard', {
        type: 'wildcard',
        data_type: 'string',
        field: 'hi',
        value: 'the?e'
    }],
    ['hi:?here', 'parse value with a prefix wildcard', {
        type: 'wildcard',
        data_type: 'string',
        field: 'hi',
        value: '?here'
    }],
    ['hi:ther*', 'parse value with a * wildcard', {
        type: 'wildcard',
        data_type: 'string',
        field: 'hi',
        value: 'ther*'
    }],
    ['hi:the?*', 'parse value with a * and ? wildcard', {
        type: 'wildcard',
        data_type: 'string',
        field: 'hi',
        value: 'the?*'
    }],
    ['hi:th?r*', 'parse value with a * and ? wildcard', {
        type: 'wildcard',
        data_type: 'string',
        field: 'hi',
        value: 'th?r*'
    }],
] as TestCase[];
