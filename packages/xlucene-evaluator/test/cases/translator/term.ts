import { escapeString } from '@terascope/utils';
import { TestCase } from './interfaces';

export default [
    [
        '*',
        'query.constant_score.filter',
        {
            bool: {
                filter: [],
            },
        },
    ],
    [
        'hello:world',
        'query.constant_score.filter',
        {
            match: {
                hello: {
                    operator: 'and',
                    query: 'world',
                },
            },
        },
    ],
    [
        'hello:w?rld',
        'query.constant_score.filter',
        {
            wildcard: {
                hello: 'w?rld',
            },
        },
    ],
    [
        'hello:/w.*ld/',
        'query.constant_score.filter',
        {
            regexp: {
                hello: 'w.*ld',
            },
        },
    ],
    [
        '_exists_:hello',
        'query.constant_score.filter',
        {
            exists: {
                field: 'hello',
            },
        },
    ],
    [
        'example_count:>=30',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    gte: 30,
                },
            },
        },
    ],
    [
        'example_count:>30',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    gt: 30,
                },
            },
        },
    ],
    [
        'example_count:<50',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    lt: 50,
                },
            },
        },
    ],
    [
        'example_count:<=50',
        'query.constant_score.filter',
        {
            range: {
                example_count: {
                    lte: 50,
                },
            },
        },
    ],
    [
        'hello-there',
        'query.constant_score.filter',
        {
            multi_match: {
                query: 'hello-there',
            },
        },
    ],
    [
        'nested.field:hello-there',
        'query.constant_score.filter',
        {
            match: {
                'nested.field': {
                    operator: 'and',
                    query: 'hello-there',
                },
            },
        },
    ],
    [
        'field.subfield:"value=something=*"',
        'query.constant_score.filter',
        {
            match: {
                'field.subfield': {
                    operator: 'and',
                    query: 'value=something=*',
                },
            },
        },
    ],
    [
        "foo:'\"bar\"'",
        'query.constant_score.filter',
        {
            match: {
                foo: {
                    operator: 'and',
                    query: '"bar"',
                },
            },
        },
    ],
    [
        `word:"${escapeString('/value\\\\')}"`,
        'query.constant_score.filter',
        {
            match: {
                word: {
                    operator: 'and',
                    query: '/value\\\\',
                },
            },
        },
    ],
    [
        'field_*:something',
        'query.constant_score.filter',
        {
            query_string: {
                fields: ['field_*'],
                query: 'something',
            },
        },
    ],
    [
        'field_*:>=100',
        'query.constant_score.filter',
        {
            query_string: {
                fields: ['field_*'],
                query: '[100 TO *]',
            },
        },
    ],
    [
        'field_*:<100',
        'query.constant_score.filter',
        {
            query_string: {
                fields: ['field_*'],
                query: '[* TO 100}',
            },
        },
    ],
    [
        'field_*:wor?d',
        'query.constant_score.filter',
        {
            query_string: {
                fields: ['field_*'],
                query: 'wor?d',
            },
        },
    ],
    [
        'field_*:/wo.*d/',
        'query.constant_score.filter',
        {
            query_string: {
                fields: ['field_*'],
                query: '/wo.*d/',
            },
        },
    ],
] as TestCase[];
