import { xLuceneFieldType } from '@terascope/types';
import { TestCase } from './interfaces.js';

export default [
    [
        'can do basic regex matches',
        'key:/ab.*/',
        [
            { key: 'abcde' },
            { key: 'field' },
            { key: 'abcdef' },
            { key: 'zabcde' },
        ],
        [
            true,
            false,
            true,
            false,
        ],
    ],
    [
        'can do basic regex matches',
        'key:/abcd/',
        [
            { key: 'abcde' },
            { key: 'field' },
            { key: 'abcdef' },
            { key: 'zabcde' },
        ],
        [
            false,
            false,
            false,
            false,
        ],
    ],
    [
        'can do basic regex matches',
        'key:/abcd/',
        [
            { key: 'abcde' },
            { key: 'field' },
            { key: 'abcdef' },
            { key: 'zabcde' },
        ],
        [
            false,
            false,
            false,
            false,
        ],
    ],
    [
        'can do more complex regex matches',
        'key:/ab{2}c{3}/',
        [
            { key: 'abbccc' },
            { key: 'field' },
            { key: 'abc' },
            { key: 'zabcde' },
        ],
        [
            true,
            false,
            false,
            false,
        ],
    ],
    [
        'can do more complex regex matches',
        'key:/ab*c*/',
        [
            { key: 'abbccc' },
            { key: 'field' },
            { key: 'abc' },
            { key: 'zabcde' },
        ],
        [
            true,
            false,
            true,
            false,
        ],
    ],
    [
        'can do more complex regex matches',
        'key:/.*abcd?e?/',
        [
            { key: 'abbccc' },
            { key: 'field' },
            { key: 'abc' },
            { key: 'zabcde' },
        ],
        [
            false,
            false,
            true,
            true,
        ],
    ],
    [
        'can do more complex compound regex matches',
        'key:/ab.*/ AND other:/data.*/',
        [
            { key: 'abcde', other: 'data2343' },
            { key: 'field' },
            { key: 'abcdef', bytes: 43 },
            { key: 'zabcde', other: 'something' },
        ],
        [
            true,
            false,
            false,
            false,
        ],
    ],
    [
        'can do more complex compound regex matches',
        '_exists_:other OR (_created:["2018-04-02" TO "2018-10-19"] OR bytes:<200)',
        [
            { key: 'abcde', other: 'data2343' },
            { key: 'field' },
            { key: 'abcdef', bytes: 43 },
            { key: 'zabcde', other: 'something' },
        ],
        [
            true,
            false,
            true,
            true,
        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can do basic regex matches with variables',
        'key: $key',
        [
            { key: 'abcde' },
            { key: 'field' },
            { key: 'abcdef' },
            { key: 'zabcde' },
        ],
        [
            true,
            false,
            true,
            false,
        ],
        { key: xLuceneFieldType.String },
        { key: '/ab.*/' }
    ],
] as TestCase[];
