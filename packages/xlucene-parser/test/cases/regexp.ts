import { xLuceneFieldType } from '@terascope/types';
import { ASTType } from '../../src';
import { TestCase } from './interfaces';

export default [
    ['example:/[a-z]+/', 'a basic regexp', {
        type: ASTType.Regexp,
        field_type: xLuceneFieldType.String,
        field: 'example',
        value: { type: 'value', value: '[a-z]+' },
    }],
    ['example: $foo', 'a basic regexp with variables', {
        type: ASTType.Regexp,
        field_type: xLuceneFieldType.String,
        field: 'example',
        value: { type: 'value', value: '[a-z]+' },
    }, { example: xLuceneFieldType.String }, { foo: /[a-z]+/ }],
    ['example:/foo:bar/', 'a regexp with a colon', {
        type: ASTType.Regexp,
        field_type: xLuceneFieldType.String,
        field: 'example',
        value: { type: 'value', value: 'foo:bar' },
    }],
    ['example:/0-9+\\//', 'regex with an escaped forward slash', {
        type: ASTType.Regexp,
        field_type: xLuceneFieldType.String,
        field: 'example',
        value: { type: 'value', value: '0-9+\\/' },
    }],
] as TestCase[];
