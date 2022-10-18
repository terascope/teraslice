import { Exists, NodeType } from '../../src/index.js';
import { TestCase } from './interfaces.js';

export default [
    ['_exists_:hello', '_exists_ with a value', {
        type: NodeType.Exists,
        field: 'hello',
    } as Exists],
] as TestCase[];
