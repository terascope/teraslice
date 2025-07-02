import type { RestrictSearchQueryOptions } from '../../../src/query-access/interfaces.js';

export type TestCase = [
    testTitle: string,
    query: string,
    options: RestrictSearchQueryOptions,
    results: any[]
];

export type TestCaseCollection = Record<
    string, // type/title of tests represented
    [
        TestCase[],
        RestrictSearchQueryOptions?
    ]
>;
