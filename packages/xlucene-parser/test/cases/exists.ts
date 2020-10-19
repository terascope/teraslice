import { ASTType } from '../../src';
import { TestCase } from './interfaces';

export default [
    ['_exists_:hello', '_exists_ with a value', {
        type: ASTType.Exists,
        field: 'hello',
    }],
] as TestCase[];
