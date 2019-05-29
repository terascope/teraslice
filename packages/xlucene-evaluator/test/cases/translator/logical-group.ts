import { TestCase } from './interfaces';

export default [
    [
        'some:query AND other:thing',
        'query.constant_score.filter.bool.should',
        [
            {
                bool: {
                    filter: [
                        {
                            term: {
                                some: 'query',
                            },
                        },
                        {
                            term: {
                                other: 'thing',
                            },
                        },
                    ],
                },
            },
        ],
    ],
    [
        'NOT value:awesome AND other:thing',
        'query.constant_score.filter.bool.should[0].bool',
        {
            filter: [
                {
                    bool: {
                        must_not: [
                            {
                                term: {
                                    value: 'awesome',
                                },
                            },
                        ],
                    },
                },
                {
                    term: {
                        other: 'thing',
                    },
                },
            ],
        },
    ],
    [
        'a:1 OR (b:1 AND c:2) OR d:(>=1 AND <=2) AND NOT e:>2',
        'query.constant_score.filter.bool',
        {
            should: [
                {
                    bool: {
                        filter: [
                            {
                                term: {
                                    a: 1,
                                },
                            },
                        ],
                    },
                },
                {
                    bool: {
                        filter: [
                            {
                                bool: {
                                    should: [
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        term: {
                                                            b: 1,
                                                        },
                                                    },
                                                    {
                                                        term: {
                                                            c: 2,
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
                {
                    bool: {
                        filter: [
                            {
                                bool: {
                                    should: [
                                        {
                                            bool: {
                                                filter: [
                                                    {
                                                        range: {
                                                            d: {
                                                                gte: 1,
                                                            },
                                                        },
                                                    },
                                                    {
                                                        range: {
                                                            d: {
                                                                lte: 2,
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                            {
                                bool: {
                                    must_not: [
                                        {
                                            range: {
                                                e: {
                                                    gt: 2,
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ],
        },
    ],
    [
        // tslint:disable-next-line: max-line-length
        'date:[2019-04-01T01:00:00Z TO *] AND field:value AND otherfield:(1 OR 2 OR 5 OR 15 OR 33 OR 28) AND NOT (otherfield:15 AND sometype:thevalue) AND NOT anotherfield:value',
        'query.constant_score.filter.bool.should',
        [
            {
                bool: {
                    filter: [
                        {
                            range: {
                                date: {
                                    gte: '2019-04-01T01:00:00Z',
                                },
                            },
                        },
                        {
                            term: {
                                field: 'value',
                            },
                        },
                        {
                            bool: {
                                should: [
                                    {
                                        bool: {
                                            filter: [
                                                {
                                                    term: {
                                                        otherfield: 1,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    {
                                        bool: {
                                            filter: [
                                                {
                                                    term: {
                                                        otherfield: 2,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    {
                                        bool: {
                                            filter: [
                                                {
                                                    term: {
                                                        otherfield: 5,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    {
                                        bool: {
                                            filter: [
                                                {
                                                    term: {
                                                        otherfield: 15,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    {
                                        bool: {
                                            filter: [
                                                {
                                                    term: {
                                                        otherfield: 33,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                    {
                                        bool: {
                                            filter: [
                                                {
                                                    term: {
                                                        otherfield: 28,
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            bool: {
                                must_not: [
                                    {
                                        bool: {
                                            should: [
                                                {
                                                    bool: {
                                                        filter: [
                                                            {
                                                                term: {
                                                                    otherfield: 15,
                                                                },
                                                            },
                                                            {
                                                                term: {
                                                                    sometype: 'thevalue',
                                                                },
                                                            },
                                                        ],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                        {
                            bool: {
                                must_not: [
                                    {
                                        term: {
                                            anotherfield: 'value',
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        ],
    ],
    [
        '_exists_:howdy AND other:>=50 OR foo:bar NOT bar:foo',
        'query.constant_score.filter.bool.should',
        [
            {
                bool: {
                    filter: [
                        {
                            exists: {
                                field: 'howdy',
                            },
                        },
                        {
                            range: {
                                other: {
                                    gte: 50,
                                },
                            },
                        },
                    ],
                },
            },
            {
                bool: {
                    filter: [
                        {
                            term: {
                                foo: 'bar',
                            },
                        },
                        {
                            bool: {
                                must_not: [
                                    {
                                        term: {
                                            bar: 'foo',
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        ],
    ],
    [
        'some:key AND (_created:>="2018-10-18T18:13:20.683Z" && bytes:(>=150000 AND <=1232322))',
        'query.constant_score.filter.bool.should[0].bool.filter',
        [
            {
                term: {
                    some: 'key',
                },
            },
            {
                bool: {
                    should: [
                        {
                            bool: {
                                filter: [
                                    {
                                        range: {
                                            _created: {
                                                gte: '2018-10-18T18:13:20.683Z',
                                            },
                                        },
                                    },
                                    {
                                        bool: {
                                            should: [
                                                {
                                                    bool: {
                                                        filter: [
                                                            {
                                                                range: {
                                                                    bytes: {
                                                                        gte: 150000,
                                                                    },
                                                                },
                                                            },
                                                            {
                                                                range: {
                                                                    bytes: {
                                                                        lte: 1232322,
                                                                    },
                                                                },
                                                            },
                                                        ],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        ],
    ],
    [
        'some:query OR other:thing OR next:value',
        'query.constant_score.filter.bool',
        {
            should: [
                {
                    bool: {
                        filter: [
                            {
                                term: {
                                    some: 'query',
                                },
                            },
                        ],
                    },
                },
                {
                    bool: {
                        filter: [
                            {
                                term: {
                                    other: 'thing',
                                },
                            },
                        ],
                    },
                },
                {
                    bool: {
                        filter: [
                            {
                                term: {
                                    next: 'value',
                                },
                            },
                        ],
                    },
                },
            ],
        },
    ],
    [
        'some:query NOT other:thing',
        'query.constant_score.filter.bool.should[0].bool',
        {
            filter: [
                {
                    term: {
                        some: 'query',
                    },
                },
                {
                    bool: {
                        must_not: [
                            {
                                term: {
                                    other: 'thing',
                                },
                            },
                        ],
                    },
                },
            ],
        },
    ],
] as TestCase[];
