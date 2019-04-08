import { ASTType } from '../../../src/parser';
import { TestCase } from './interfaces';

export default [
    ['example:/[a-z]+/', 'a basic regexp', {
        type: ASTType.Regexp,
        data_type: 'string',
        field: 'example',
        value: '[a-z]+'
    }],
    ['example:/foo:bar/', 'a regexp with a colon', {
        type: ASTType.Regexp,
        data_type: 'string',
        field: 'example',
        value: 'foo:bar'
    }],
    ['example:/0-9+\\//', 'regex with an escaped forward slash', {
        type: ASTType.Regexp,
        data_type: 'string',
        field: 'example',
        value: '0-9+\\/'
    }],
] as TestCase[];
