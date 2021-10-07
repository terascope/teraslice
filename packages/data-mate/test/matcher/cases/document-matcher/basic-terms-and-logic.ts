import { xLuceneFieldType } from '@terascope/types';
import { TestCase } from './interfaces';

export default [
    [
        'can match basic terms',
        'hello:world',
        [{ hello: 'world' }, { hello: 'goodbye' }, { something: 'else' }, {}],
        [true, false, false, false],
        { hello: xLuceneFieldType.String }
    ],
    [
        'can match basic terms in objects',
        'foo:bar',
        [{ foo: 'bar' }, { other: 'thing' }, { foo: ['bar'] }, { foo: ['baz', 'bar'] }],
        [true, false, true, true]
    ],
    [
        'can match boolean true with no type',
        'bool:true',
        [{ bool: false }, { bool: true }, { bool: 'false' }, { bool: 'true' }, { something: 'else' }, {}],
        [false, true, false, false, false, false],
    ],
    [
        'can match boolean false with no type',
        'bool:false',
        [{ bool: false }, { bool: true }, { bool: 'false' }, { bool: 'true' }, { something: 'else' }, {}],
        [true, false, false, false, false, false]
    ],
    [
        'can match boolean true with String type',
        'bool:true',
        [{ bool: false }, { bool: true }, { bool: 'false' }, { bool: 'true' }, { something: 'else' }, {}],
        [false, false, false, true, false, false],
        { bool: xLuceneFieldType.String }
    ],
    [
        'can match boolean false with String type',
        'bool:false',
        [{ bool: false }, { bool: true }, { bool: 'false' }, { bool: 'true' }, { something: 'else' }, {}],
        [false, false, true, false, false, false],
        { bool: xLuceneFieldType.String }
    ],
    [
        'can match non-quoted boolean false',
        'bool:"false"',
        [{ bool: false }, { bool: true }, { bool: 'false' }, { bool: 'true' }, { something: 'else' }, {}],
        [true, false, false, false, false, false],
        { bool: xLuceneFieldType.Boolean }
    ],
    [
        'can match non-quoted boolean true',
        'bool:"true"',
        [{ bool: false }, { bool: true }, { bool: 'false' }, { bool: 'true' }, { something: 'else' }, {}],
        [false, true, false, false, false, false],
        { bool: xLuceneFieldType.Boolean }
    ],
    [
        'can match basic terms in objects',
        'foo:bar',
        [{ foo: 'bar' }, { other: 'thing' }, { foo: ['bar'] }, { foo: ['baz', 'bar'] }],
        [true, false, true, true]
    ],
    [
        'can handle "AND" operators',
        'some:data AND other:stuff',
        [{ some: 'data' }, { some: 'data', other: 'things' }, { some: 'data', other: 'stuff' }],
        [false, false, true]
    ],
    [
        'can handle "&&" operators',
        'some:data && other:stuff',
        [{ some: 'data' }, { some: 'data', other: 'things' }, { some: 'data', other: 'stuff' }],
        [false, false, true]
    ],
    [
        'can handle ""R: operators',
        'some:data OR other:stuff',
        [{ some: 'data' }, { some: 'otherData', other: 'things' }, { some: 'otherData', other: 'stuff' }, { some: 'data', other: 'stuff' }],
        [true, false, true, true]
    ],
    [
        'can handle "||" operators',
        'some:data || other:stuff',
        [{ some: 'data' }, { some: 'otherData', other: 'things' }, { some: 'otherData', other: 'stuff' }, { some: 'data', other: 'stuff' }],
        [true, false, true, true]
    ],
    [
        'can handle single "NOT" operators',
        'NOT other:stuff',
        [
            { some: 'data' },
            { some: 'otherData', other: 'things' },
            { some: 'otherData', other: 'stuff' },
            { some: 'data', other: 'stuff' },
        ],
        [
            true,
            true,
            false,
            false,
        ],
    ],
    [
        'can handle single "!" operators',
        '! other:stuff',
        [
            { some: 'data' },
            { some: 'otherData', other: 'things' },
            { some: 'otherData', other: 'stuff' },
            { some: 'data', other: 'stuff' },
        ],
        [
            true,
            true,
            false,
            false,
        ]
    ],
    [
        'can handle compound "NOT" operators',
        'some:data NOT other:stuff',
        [
            { some: 'data' },
            { some: 'otherData', other: 'things' },
            { some: 'otherData', other: 'stuff' },
            { some: 'data', other: 'stuff' },
        ],
        [
            true,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle compound "!" operators',
        'some:data ! other:stuff',
        [
            { some: 'data' },
            { some: 'otherData', other: 'things' },
            { some: 'otherData', other: 'stuff' },
            { some: 'data', other: 'stuff' },
        ],
        [
            true,
            true,
            false,
            true,
        ]
    ],
    [
        'can handle compound "!" operators',
        'some:data ! other:stuff',
        [
            { some: 'data' },
            { some: 'otherData', other: 'things' },
            { some: 'otherData', other: 'stuff' },
            { some: 'data', other: 'stuff' },
        ],
        [
            true,
            true,
            false,
            true,
        ]
    ],
    [
        'can handle conjunction operators with "!" operators',
        'some:data AND !other:stuff',
        [
            { some: 'data' },
            { some: 'otherData', other: 'things' },
            { some: 'otherData', other: 'stuff' },
            { some: 'data', other: 'stuff' },
        ],
        [
            true,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle "AND NOT" operators',
        'some:data AND NOT other:stuff',
        [
            { some: 'data' },
            { some: 'otherData', other: 'things' },
            { some: 'otherData', other: 'stuff' },
            { some: 'data', other: 'stuff' },
        ],
        [
            true,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle long complex chaining of AND operators',
        'some:data AND other:things AND third:stuff AND fourth:stuff',
        [
            {
                some: 'data',
                other: 'things',
                third: 'stuff',
                fourth: 'stuff'
            },
            {
                some: 'data',
                other: 'things',
                third: 'stuff',
                fourth: 'other'
            },
            {
                some: 'data',
                other: 'things',
                third: 'other',
                fourth: 'stuff'
            },
            { some: 'data', other: 'stuff' },
        ],
        [
            true,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle long complex chaining of AND NOT operators',
        'some:data AND NOT other:stuff AND NOT bytes:1234',
        [
            {
                some: 'data',
                other: 'things',
                third: 'stuff',
                fourth: 'stuff'
            },
            {
                some: 'data',
                other: 'things',
                third: 'stuff',
                fourth: 'other'
            },
            {
                some: 'data',
                other: 'things',
                third: 'other',
                fourth: 'stuff'
            },
            { some: 'data', other: 'stuff' },
        ],
        [
            true,
            true,
            true,
            false,
        ]
    ],
    [
        'can handle long complex chaining of AND ! operators',
        'some:data AND ! other:stuff AND ! bytes:1234',
        [
            {
                some: 'data',
                other: 'things',
                third: 'stuff',
                fourth: 'stuff'
            },
            {
                some: 'data',
                other: 'things',
                third: 'stuff',
                fourth: 'other'
            },
            {
                some: 'data',
                other: 'things',
                third: 'other',
                fourth: 'stuff'
            },
            { some: 'data', other: 'stuff' },
        ],
        [
            true,
            true,
            true,
            false,
        ]
    ],
    [
        'can handle _exists_',
        '_exists_:some',
        [
            { some: 'data' },
            { other: 'data' },
            { some: null },
            { some: '' },
            { some: [] },
            { some: [null] },
            { some: ['data', null] },
        ],
        [
            true,
            false,
            false,
            true,
            false,
            false,
            true,
        ]
    ],
    [
        'can handle complex term AND () operators',
        'some:data AND (other:stuff OR other:things)',
        [
            { some: 'data' },
            { some: 'otherData', other: 'things' },
            { some: 'otherData', other: 'stuff' },
            { some: 'data', other: 'stuff' },
            { some: 'data', fake: 'stuff' },
            { data: 'data', fake: 'stuff' },
            { data: 'data', other: 'stuff' },
        ],
        [
            false,
            false,
            false,
            true,
            false,
            false,
            false
        ]
    ],
    [
        'can handle complex term OR () operators',
        'some:data OR (other:stuff OR other:things)',
        [
            { some: 'data' },
            { some: 'otherData', other: 'things' },
            { some: 'otherData', other: 'stuff' },
            { some: 'data', other: 'stuff' },
            { some: 'data', fake: 'stuff' },
            { data: 'data', fake: 'stuff' },
            { data: 'data', other: 'stuff' },
        ],
        [
            true,
            true,
            true,
            true,
            true,
            false,
            true,
        ]
    ],
    [
        'can handle parens with 5 OR terms',
        'id:(hi OR hello OR howdy OR aloha OR hey)',
        [
            { id: 'hello' },
            { id: 'hi' },
            { id: 'howdy' },
            { id: 'aloha' },
            { id: 'hey' },
            { id: 'bye' }
        ],
        [
            true,
            true,
            true,
            true,
            true,
            false,
        ]
    ],
    [
        'can handle a query that starts with NOT',
        'NOT value:wrong AND other:thing',
        [
            { value: 'awesome', other: 'thing' },
            { value: 'wrong', other: 'thing' },
            { value: 'awesome', other: 'wrong' },
            { value: 'wrong' },
        ],
        [
            true,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle the query "a:false NOT b:true AND c:false"',
        'a:false NOT b:true AND c:false',
        [
            { a: false, b: false, c: false, },
            { a: true, b: false, c: false, },
            { a: true, b: true, c: false, },
            { a: false, b: true, c: false, },
            { a: false, b: true, c: true, },
            { a: false, b: false, c: true, },
        ],
        [
            true,
            false,
            false,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle the query "a:false, NOT b:true, AND c:false"',
        'a:false OR b:false AND c:true',
        [
            { a: false, b: true, c: true, },
            { a: true, b: false, c: true, },
            { a: false, b: false, c: false, },
            { a: true, b: true, c: true, },
        ],
        [
            true,
            true,
            true,
            false,
        ]
    ],
] as TestCase[];
