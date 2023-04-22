import { xLuceneFieldType } from '@terascope/types';
import { NodeType, Regexp } from '../../src';
import { TestCase } from './interfaces';

export default [
    ['example:/[a-z]+/', 'a basic regexp', {
        type: NodeType.Regexp,
        field_type: xLuceneFieldType.String,
        field: 'example',
        value: { type: 'value', value: '[a-z]+' },
    }],
    ['example: $foo', 'a basic regexp with variables', {
        type: NodeType.Regexp,
        field_type: xLuceneFieldType.String,
        field: 'example',
        value: { type: 'value', value: '[a-z]+' },
    } as Regexp, { example: xLuceneFieldType.String }, { foo: /[a-z]+/ }],
    ['example:/foo:bar/', 'a regexp with a colon', {
        type: NodeType.Regexp,
        field_type: xLuceneFieldType.String,
        field: 'example',
        value: { type: 'value', value: 'foo:bar' },
    } as Regexp],
    ['example:/0-9+\\//', 'regex with an escaped forward slash', {
        type: NodeType.Regexp,
        field_type: xLuceneFieldType.String,
        field: 'example',
        value: { type: 'value', value: '0-9+\\/' },
    } as Regexp],
] as TestCase[];

export const looseRegex = [
    [
        'example: $foo',
        'a basic regexp with variables',
        {
            type: NodeType.Empty,
        },
        { example: xLuceneFieldType.String },
        { }
    ],
    [
        'example: $bar OR $foo',
        'a basic regexp with variables',
        {
            type: NodeType.Term,
            // TODO fix parser filter to add the parent field/type
            // field_type: xLuceneFieldType.String,
            // field: 'example',
            value: { type: 'variable', scoped: false, value: 'foo' },
        },
        { example: xLuceneFieldType.String },
        { foo: /[a-z]+/ }
    ],
] as TestCase[];
