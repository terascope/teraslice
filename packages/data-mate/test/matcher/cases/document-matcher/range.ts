import { TestCase } from './interfaces.js';

const ageData = [
    { age: 33 },
    { age: 8 },
    { age: 8100 },
    { other: 33 },
    { age: 10 },
];

const ageData2 = [
    { age: 8 },
    { age: 10 },
    { age: 15 },
    { age: 20 },
    { age: 50 },
    { age: 100 },
];

const ageData3 = [
    { age: 8 },
    { age: 10 },
    { age: 15 },
    { age: 20 },
    { age: 50 },
    { age: 100 },
];

export default [
    [
        'can handle range > queries',
        'age:>0',
        ageData,
        [
            true,
            true,
            true,
            false,
            true,
        ]
    ],
    [
        'can handle range > queries',
        'age:>10',
        ageData,
        [
            true,
            false,
            true,
            false,
            false,
        ]
    ],
    [
        'can handle range < queries',
        'age:<10',
        ageData,
        [
            false,
            true,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle range >= queries',
        'age:>=10',
        ageData,
        [
            true,
            false,
            true,
            false,
            true,
        ]
    ],
    [
        'can handle range <= queries',
        'age:<=10',
        ageData,
        [
            false,
            true,
            false,
            false,
            true,
        ]
    ],
    [
        'can handle range parens (> <) queries',
        'age:(>10 AND <20)',
        ageData2,
        [
            false,
            false,
            true,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle range parens (>= <) queries',
        'age:(>=10 AND <20)',
        ageData2,
        [
            false,
            true,
            true,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle range parens (> =<) queries',
        'age:(>10 AND <=20)',
        ageData2,
        [
            false,
            false,
            true,
            true,
            false,
            false,
        ]
    ],
    [
        'can handle range parens (>= =<) queries',
        'age:(>=10 AND <=20)',
        ageData2,
        [
            false,
            true,
            true,
            true,
            false,
            false,
        ]
    ],
    [
        'can handle range parens (>= =<) OR >= queries',
        'age:((>=10 AND <=20) OR >=100)',
        ageData2,
        [
            false,
            true,
            true,
            true,
            false,
            true,
        ]
    ],
    [
        'can handle elasticsearch range queries []',
        'age:[0 TO *]',
        ageData3,
        [
            true,
            true,
            true,
            true,
            true,
            true,
        ]
    ],
    [
        'can handle elasticsearch range queries {]',
        'age:{10 TO 20]',
        ageData3,
        [
            false,
            false,
            true,
            true,
            false,
            false,
        ]
    ],
    [
        'can handle elasticsearch range queries {]',
        'age:[10 TO 20}',
        ageData3,
        [
            false,
            true,
            true,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle elasticsearch range queries {}',
        'age:{10 TO 20}',
        ageData3,
        [
            false,
            false,
            true,
            false,
            false,
            false,
        ]
    ],
    [
        'can handle compound elasticsearch range queries [] OR >=',
        'age:([10 TO 20] OR >=100)',
        ageData3,
        [
            false,
            true,
            true,
            true,
            false,
            true,
        ]
    ],
    [
        'can handle compound elasticsearch range queries [] OR >=',
        // switching directions of last test to check grammar
        'age:(>=100 OR [10 TO 20])',
        ageData3,
        [
            false,
            true,
            true,
            true,
            false,
            true,
        ]
    ],
    [
        'can handle nested values',
        'person.age:[0 TO *]',
        [
            { person: { age: 8 } },
            { person: { age: 10 } },
            { person: { age: 15 } },
            { person: { age: 20 } },
            { person: { age: 50 } },
            { person: { age: 100 } }
        ],
        [
            true,
            true,
            true,
            true,
            true,
            true,
        ]
    ],
    [
        'can handle bad values',
        'person.age:[0 TO *]',
        [
            {},
            { person: 'asdfasdf' },
            [123, 4234],
            { person: null },
            { person: ['asdf'] },
            { other: { age: 100 } },
        ],
        [
            false,
            false,
            false,
            false,
            false,
            false,
        ]
    ],
] as TestCase[];
