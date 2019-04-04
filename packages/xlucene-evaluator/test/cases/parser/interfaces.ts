import { V2AST } from '../../../src/parser';

export type TestCase = [
    // when give query %s
    string,
    // it should be able to %s
    string,
    // toMatchObject(%j)
    V2AST
];
