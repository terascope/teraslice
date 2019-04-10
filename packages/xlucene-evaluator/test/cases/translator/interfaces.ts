import { TypeConfig } from '../../../src';
import { AnyQuery } from '../../../src/translator/interfaces';

export type TestCase = [
    // when given %s
    string,
    // property in dot notation form
    string,
    // toHaveProperty($property, %j)
    AnyQuery,
    // optional types config
    TypeConfig?
];
