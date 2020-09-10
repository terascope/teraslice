import { xLuceneVariables, xLuceneTypeConfig } from '@terascope/types';

export type TestCase = [
    // when give query %s
    string,
    // it should be able to parse %s
    string,
    // toMatchObject(%j)
    any[],
    // results(%j)
    any[],
    // Type config to pass in
    xLuceneTypeConfig?,
    xLuceneVariables?
];
