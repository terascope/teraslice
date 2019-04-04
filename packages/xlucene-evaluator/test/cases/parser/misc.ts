import { TestCase } from './interfaces';

export default [
    ['_exists_:hello', '_exists_ with a value', {
        type: 'exists',
        field: 'hello',
    }],
] as TestCase[];
