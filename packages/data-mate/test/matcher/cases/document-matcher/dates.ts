import addDays from 'date-fns/addDays';
import { xLuceneFieldType } from '@terascope/types';
import { TestCase } from './interfaces.js';

const now = new Date();

export default [
    [
        'can do exact matches, no type changes',
        '_created:"2018-10-18T18:13:20.683Z"',
        [
            { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: 'Thu, 18 Oct 2018 18:13:20 GMT' },
        ],
        [
            false,
            true,
            false,
        ],
    ],
    [
        'can do exact matches, no type changes',
        '_created:"Thu, 18 Oct 2018 18:13:20 GMT"',
        [
            { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: 'Thu, 18 Oct 2018 18:13:20 GMT' },
        ],
        [
            false,
            false,
            true,
        ]
    ],
    [
        'can do exact matches, no type changes',
        '_created:"Thu Oct 18 2018 11:13:20 GMT-0700"',
        [
            { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: 'Thu, 18 Oct 2018 18:13:20 GMT' },
        ],
        [
            true,
            false,
            false,
        ],
    ],
    [
        'can do exact matches, no type changes',
        '_created:"Thu Oct 18 2018 11:13:20 GMT-0700"',
        [
            { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: 'Thu, 18 Oct 2018 18:13:20 GMT' },
        ],
        [
            true,
            false,
            false,
        ],
    ],
    [
        'can match dates, with type changes',
        '_created:"2018-10-18T18:13:20.683Z"',
        [
            { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: 'Thu, 18 Oct 2018 18:13:20 GMT' },
        ],
        [
            false,
            true,
            false,
        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can match dates, with type changes',
        '_created:"Thu Oct 18 2018 11:13:20 GMT-0700"',
        [
            { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: 'Thu, 18 Oct 2018 18:15:20 GMT' },
        ],
        [
            true,
            false,
            false,
        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can match dates, with type changes',
        '_created:"Thu, 18 Oct 2018 18:15:20 GMT"',
        [
            { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: 'Thu, 18 Oct 2018 18:15:20 GMT' },
        ],
        [
            false,
            false,
            true,
        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can accept unquoted dates',
        'date:[2018-10-10T17:36:13Z TO 2018-10-10T20:36:13Z]',
        [
            { date: '2018-10-10T17:36:13Z', value: 252, type: 'example' },
            { date: '2018-10-10T18:36:13Z', value: 253, type: 'other' },
        ],
        [
            true,
            true,
        ],
        { date: xLuceneFieldType.Date }
    ],
    [
        'date fields do not throw with wrong data',
        '_created:"2018-10-18T18:13:20.683Z"',
        [
            { _created: { some: 'thing' } },
            { _created: [3, 53, 2342] },
            { _created: false },
            { _created: null },
            { _created: 'asdfiuyasdf8yhkjlasdf' },
        ],
        [
            false,
            false,
            false,
            false,
            false,
        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can handle ">=", with type changes',
        '_created:>="2018-10-18T18:13:20.683Z"',
        [
            { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: '2018-10-18T18:15:34.123Z' },
            { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' },
            { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' },
        ],
        [
            true,
            true,
            true,
            true,
            false,
        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can handle "<", with type changes',
        '_created:<"Thu Oct 18 2018 11:13:20 GMT-0700"',
        [
            { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: '2018-10-18T18:15:34.123Z' },
            { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' },
            { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' },
        ],
        [
            false,
            false,
            false,
            false,
            true,

        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can handle "<=", with type changes',
        '_created:<="2018-10-18T18:13:20.683Z"',
        [
            { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: '2018-10-18T18:15:34.123Z' },
            { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' },
            { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' },
        ],
        [
            false,
            true,
            false,
            false,
            true,
        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can handle "[]", with type changes',
        '_created:[2018-10-18T18:13:20.683Z TO *]',
        [
            { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: '2018-10-18T18:15:34.123Z' },
            { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' },
            { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' },
        ],
        [
            true,
            true,
            true,
            true,
            false,
        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can handle "{}", with type changes',
        '_created:{"2018-10-10" TO "Thu Oct 18 2018 11:13:20 GMT-0700"}',
        [
            { _created: 'Thu Oct 18 2018 22:13:20 GMT-0700' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: '2018-10-18T18:15:34.123Z' },
            { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' },
            { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' },
        ],
        [
            false,
            false,
            false,
            false,
            true,
        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can handle mixed"[}", with type changes',
        '_created:{2018-10-18T18:13:20.000Z TO 2018-10-18T18:13:20.783Z]',
        [
            { _created: '2018-10-18T18:13:20.000Z' },
            { _created: '2018-10-18T18:13:20.683Z' },
            { _created: '2018-10-18T18:15:34.123Z' },
            { _created: 'Thu, 18 Oct 2020 18:13:20 GMT' },
            { _created: 'Thu, 13 Oct 2018 18:13:20 GMT' },
        ],
        [
            false,
            true,
            false,
            false,
            false,
        ],
        { _created: xLuceneFieldType.Date }
    ],
    [
        'can match date math query',
        '_created:>now+3h',
        [
            { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' },
            { _created: addDays(now, 3) },
            { _created: now },
        ],
        [
            false,
            true,
            false,
        ],
        { _created: 'date' }
    ],
    [
        'can match date math range',
        '_created:[now-3h TO now+5d]',
        [
            { _created: 'Thu Oct 18 2018 11:13:20 GMT-0700' },
            { _created: addDays(now, 3) },
            { _created: new Date() },
        ],
        [
            false,
            true,
            true,
        ],
        { _created: 'date' }
    ],
] as TestCase[];
