import { xLuceneFieldType } from '@terascope/types';
import { TestCase } from './interfaces.js';

const keyData = [
    { key: 'abcde' },
    { key: 'field' },
    { key: 'abcdef' },
    { key: 'zabcde' },
    { key: 'hello abcde' },
    { key: 'abcde hello' },
    { key: 'abcccde' },
];

const wildcardFieldData = [
    { some: 'value', city: { key: 'abcde', field: 'other' } },
    { some: 'value', city: { key: 'abcde', field: 'other', nowIsTrue: 'something' } },
    { some: 'value', city: { key: 'abcde', deeper: { nowIsTrue: 'something' } } },
    { some: 'value', city: { key: 'abcde', deeper: { other: 'thing' } } },
];

export default [
    [
        'can do basic * wildcard matches',
        'key:abc*',
        keyData,
        [
            true,
            false,
            true,
            false,
            false,
            true,
            true,
        ],
    ],
    [
        'can do basic ? wildcard matches',
        'key:abc??de',
        keyData,
        [
            false,
            false,
            false,
            false,
            false,
            false,
            true,
        ],
    ],
    [
        'can do mix * ? wildcard matches',
        'key:?abc*',
        keyData,
        [
            false,
            false,
            false,
            true,
            false,
            false,
            false,
        ],
    ],
    [
        'can do mix * * wildcard matches',
        'key:*abc*',
        keyData,
        [
            true,
            false,
            true,
            true,
            true,
            true,
            true,
        ],
    ],
    [
        'can do more field wildcard queries one level deep',
        'city.*:something',
        wildcardFieldData,
        [
            false,
            true,
            false,
            false
        ],
    ],
    [
        'can do more field wildcard queries with one level deep fields with wildcard term',
        'city.*:someth*',
        wildcardFieldData,
        [
            false,
            true,
            false,
            false
        ],
    ],
    [
        'can do more field wildcard queries with two level deep fields with wildcard term',
        'city.deeper.*:someth*',
        wildcardFieldData,
        [
            false,
            false,
            true,
            false
        ],
    ],
    [
        'can do more field wildcard queries with two level deep wildcard fields with wildcard term',
        'city.*.*:someth*',
        wildcardFieldData,
        [
            false,
            false,
            true,
            false
        ],
    ],
    [
        'can do more field wildcard queries with two level deep wildcard fields with complex terms',
        'city.*.*:(someth* OR thin?)',
        wildcardFieldData,
        [
            false,
            false,
            true,
            true,
        ],
    ],
    [
        'can not do basic * wildcard matches with variables',
        'key: $key',
        keyData,
        [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
        ],
        { key: xLuceneFieldType.String },
        { key: 'abc*' }
    ],
] as TestCase[];
