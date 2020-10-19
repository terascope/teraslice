import { ASTType } from '../../src';
import { TestCase } from './interfaces';

export default [
    ['', 'an empty query', {
        type: ASTType.Empty,
    }],
] as TestCase[];
