import type { RestrictSearchQueryOptions } from '../../../src/query-access/interfaces.js';
import type { TestCase } from './interfaces.js';

// in case future tests add more fields
const defaultOptions: RestrictSearchQueryOptions = {
    params: { _source_includes: ['bar', 'foo'] }
};

const arrayCases: TestCase[] = [
    [
        'should correctly inner join',
        'bar:@bar',
        {
            variables: { '@bar': ['bar2', 'bar4'] }
        },
        [
            { bar: 'bar2', foo: 'foo2' },
            { bar: 'bar2', foo: 'foo3' },
            { bar: 'bar4', foo: null }]
    ],
    [
        'should correctly inner join when using an AND',
        'bar:@bar AND foo:@foo',
        {
            variables: {
                '@bar': ['bar2', 'bar4'],
                '@foo': ['foo3', 'foo2']
            },
        },
        [
            { bar: 'bar2', foo: 'foo2' },
            { bar: 'bar2', foo: 'foo3' }
        ]
    ],
    [
        'should correctly inner join when using an OR',
        'bar:@bar OR foo:@foo',
        {
            variables: {
                '@bar': ['bar1'],
                '@foo': ['foo2', 'foo4']
            }
        },
        [
            { foo: 'foo1', bar: 'bar1' },
            { foo: 'foo2', bar: 'bar2' },
            { foo: 'foo4', bar: 'bar3' }
        ]
    ],
    [
        'should correctly inner join when using parens and OR',
        '(bar:@bar AND foo:@foo) OR bar:@bar2',
        {
            variables: {
                '@bar': ['bar2'],
                '@bar2': ['bar3'],
                '@foo': ['foo2', 'foo4']
            },
        },
        [
            { foo: 'foo2', bar: 'bar2' },
            { foo: 'foo4', bar: 'bar3' }
        ]
    ],
    [
        'should correctly inner join when using parens and AND',
        '(bar:@bar AND foo:@foo) AND bar:@bar2',
        {
            variables: {
                '@bar': ['bar3'],
                '@bar2': ['bar3'],
                '@foo': ['foo2', 'foo4']
            }
        },
        [
            { foo: 'foo4', bar: 'bar3' }
        ]
    ]
];

const emptyArrayCases: TestCase[] = [
    [
        'should correctly inner join',
        'bar:@bar',
        { variables: { '@bar': [] } },
        []
    ],
    [
        'should correctly inner join when using an AND',
        'bar:@bar AND foo:@foo',
        {
            variables: {
                '@bar': [],
                '@foo': ['foo2', 'foo4']
            }
        },
        []
    ],
    [
        'should correctly inner join when using an OR',
        'bar:@bar OR foo:@foo',
        {
            variables: {
                '@bar': [],
                '@foo': ['foo2', 'foo4']
            }
        },
        [
            { foo: 'foo2', bar: 'bar2' },
            { foo: 'foo4', bar: 'bar3' }
        ]
    ],
    [
        'should correctly inner join when using parens and OR',
        '(bar:@bar AND foo:@foo) OR bar:@bar2',
        {
            variables: {
                '@bar': [],
                '@bar2': ['bar3'],
                '@foo': ['foo2', 'foo4']
            }
        },
        [
            { foo: 'foo4', bar: 'bar3' }
        ]
    ],
    [
        'should correctly inner join when using parens and AND',
        '(bar:@bar AND foo:@foo) AND bar:@bar2',
        {
            variables: {
                '@bar': [],
                '@bar2': ['bar3'],
                '@foo': ['foo2', 'foo4']
            }
        },
        []
    ]
];

const arrays: [TestCase[], RestrictSearchQueryOptions?] = [arrayCases, defaultOptions];
const empty_arrays: [TestCase[], RestrictSearchQueryOptions?] = [emptyArrayCases, defaultOptions];

export { arrays, empty_arrays };
