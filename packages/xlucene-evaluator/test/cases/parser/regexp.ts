import { FieldType, ASTType } from '../../../src';
import { TestCase } from './interfaces';

export default [
    ['example:/[a-z]+/', 'a basic regexp', {
        type: ASTType.Regexp,
        field_type: FieldType.String,
        field: 'example',
        value: '[a-z]+'
    }],
    ['example:/foo:bar/', 'a regexp with a colon', {
        type: ASTType.Regexp,
        field_type: FieldType.String,
        field: 'example',
        value: 'foo:bar'
    }],
    ['example:/0-9+\\//', 'regex with an escaped forward slash', {
        type: ASTType.Regexp,
        field_type: FieldType.String,
        field: 'example',
        value: '0-9+\\/'
    }],
] as TestCase[];
