import { TestCase } from './interfaces';

export default [
    ['hi:the?e', 'value with ? wildcard', {
        type: 'wildcard',
        data_type: 'string',
        field: 'hi',
        value: 'the?e'
    }],
    ['hi:?here', 'value with a prefix wildcard', {
        type: 'wildcard',
        data_type: 'string',
        field: 'hi',
        value: '?here'
    }],
    ['hi:ther*', 'value with a * wildcard', {
        type: 'wildcard',
        data_type: 'string',
        field: 'hi',
        value: 'ther*'
    }],
    ['hi:the?*', 'value with a * and ? wildcard', {
        type: 'wildcard',
        data_type: 'string',
        field: 'hi',
        value: 'the?*'
    }],
    ['hi:th?r*', 'value with a * and ? wildcard', {
        type: 'wildcard',
        data_type: 'string',
        field: 'hi',
        value: 'th?r*'
    }],
    ['*', 'a field-less * query', {
        type: 'wildcard',
        field: null,
        value: '*',
    }],
    ['?', 'a field-less ? query', {
        type: 'wildcard',
        field: null,
        value: '?',
    }],
] as TestCase[];
