import { NodeType } from '../../src';
import { TestCase } from './interfaces';

export default [
    ['', 'an empty query', {
        type: NodeType.Empty,
    }],
] as TestCase[];
