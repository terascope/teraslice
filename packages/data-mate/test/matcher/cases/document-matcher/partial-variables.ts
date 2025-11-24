import { xLuceneFieldType } from '@terascope/types';
import { cloneDeep } from '@terascope/core-utils';
import { TestCase } from './interfaces.js';

const data = [
    {
        alive: true,
        friends: ['Frank', 'Jane']
    },
    {
        name: 'Billy',
        friends: ['Jill']
    },
    {
        age: 20,
        friends: ['Jill']
    },
    {
        name: 'Jane',
        age: 10,
        alive: false,
        friends: ['Jill']
    },
    {
        name: 'Nancy',
        age: 10,
        friends: null
    },
];

export default [
    [
        'should be able to search on partial data',
        'name:Jill OR age:>=12',
        cloneDeep(data),
        [false, false, true, false, false],
        {
            name: xLuceneFieldType.String,
            age: xLuceneFieldType.Number,
            alive: xLuceneFieldType.Boolean,
            friends: xLuceneFieldType.String
        },
    ],
    [
        'should be able to search with partial variables in simple queries',
        'name:@name',
        cloneDeep(data),
        [false, false, false, false, false],
        {
            name: xLuceneFieldType.String,
            age: xLuceneFieldType.Number,
            alive: xLuceneFieldType.Boolean,
            friends: xLuceneFieldType.String
        },
        { '@name': undefined }
    ],
    [
        'should be able to search with partial variables in OR statements (term type)',
        'name:@name OR age:@age',
        cloneDeep(data),
        [false, false, true, false, false],
        {
            name: xLuceneFieldType.String,
            age: xLuceneFieldType.Number,
            alive: xLuceneFieldType.Boolean,
            friends: xLuceneFieldType.String
        },
        { '@name': undefined, '@age': 20 }
    ],
    [
        'should be able to search with partial variables in OR statements (int type)',
        'name:@name OR age:@age',
        cloneDeep(data),
        [false, true, false, false, false],
        {
            name: xLuceneFieldType.String,
            age: xLuceneFieldType.Number,
            alive: xLuceneFieldType.Boolean,
            friends: xLuceneFieldType.String
        },
        { '@name': 'Billy', '@age': undefined }
    ],
    [
        'should be able to search with partial variables in AND statements',
        'name:@name AND age:@age',
        cloneDeep(data),
        [false, false, false, false, false],
        {
            name: xLuceneFieldType.String,
            age: xLuceneFieldType.Number,
            alive: xLuceneFieldType.Boolean,
            friends: xLuceneFieldType.String
        },
        { '@name': 'Billy', '@age': undefined }
    ],
    [
        'should be able to search with partial variables in Complex statements',
        'name:@name OR (age:@age OR alive:@alive)',
        cloneDeep(data),
        [false, true, false, true, false],
        {
            name: xLuceneFieldType.String,
            age: xLuceneFieldType.Number,
            alive: xLuceneFieldType.Boolean,
            friends: xLuceneFieldType.String
        },
        {
            '@name': 'Billy',
            '@age': undefined,
            '@alive': false
        }
    ],
    [
        'should be able to search with partial variables in Complex AND statements',
        'name:@name OR (age:@age AND alive:@alive)',
        cloneDeep(data),
        [false, false, false, true, false],
        {
            name: xLuceneFieldType.String,
            age: xLuceneFieldType.Number,
            alive: xLuceneFieldType.Boolean,
            friends: xLuceneFieldType.String
        },
        {
            '@name': undefined,
            '@age': 10,
            '@alive': false
        }
    ],
] as TestCase[];
