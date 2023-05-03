import { Exists, NodeType } from '../../src';
import { TestCase } from './interfaces';

export default [
    ['_exists_:hello', '_exists_ with a value', {
        type: NodeType.Exists,
        field: 'hello',
    } as Exists]
] as TestCase[];

export const filterNilExists: TestCase[] = [
    [
        '_exists_:hello',
        '_exists_', {
            type: NodeType.Exists,
            field: 'hello',
        } as Exists
    ],
    [
        '_exists_:hello OR $foo',
        '_exists_ with OR grouping', {
            type: NodeType.Exists,
            field: 'hello',
        },
    ],
    // NOTE _exists_:$foo gives term so _exists_ doesn't support variables
];
