import { Exists, NodeType } from '../../src';
import { TestCase } from './interfaces';

export default [
    ['_exists_:hello', '_exists_ with a value', {
        type: NodeType.Exists,
        field: 'hello',
    } as Exists],
] as TestCase[];
