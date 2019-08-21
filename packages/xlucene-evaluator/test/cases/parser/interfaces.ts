import { AST, TypeConfig } from '../../../src';

export type TestCase = [
    // when give query %s
    string,
    // it should be able to parse %s
    string,
    // toMatchObject(%j)
    AST,
    // Type config to pass in
    TypeConfig?
];
