import { ASTType } from '../../../src/parser';
import { TestCase } from './interfaces';

export default [
    ['', 'an empty query', {
        type: ASTType.Empty,
    }],
] as TestCase[];
