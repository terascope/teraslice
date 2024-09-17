import { NodeType } from '../../src/index.js';
import { TestCase } from './interfaces.js';

export default [
    ['',
        'an empty query',
        {
            type: NodeType.Empty,
        }],
] as TestCase[];
