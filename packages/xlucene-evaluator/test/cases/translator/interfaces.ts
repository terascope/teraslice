import { TypeConfig } from '../../../src';

export type TestCase = [
    // when given %s
    string,
    // property in dot notation form
    string,
    // toHaveProperty($property, %j)
    any,
    // optional types config
    TypeConfig?
];
