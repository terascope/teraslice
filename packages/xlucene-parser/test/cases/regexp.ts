import { xLuceneFieldType } from '@terascope/types';
import { NodeType, Regexp, Term } from '../../src/index.js';
import { TestCase } from './interfaces.js';

export default [
    ['example:/[a-z]+/',
        'a basic regexp',
        {
            type: NodeType.Regexp,
            field_type: xLuceneFieldType.String,
            field: 'example',
            value: { type: 'value', value: '[a-z]+' },
        }],
    ['example: $foo',
        'a basic regexp with variables',
        {
            type: NodeType.Regexp,
            field_type: xLuceneFieldType.String,
            field: 'example',
            value: { type: 'value', value: '[a-z]+' },
        } as Regexp,
        { example: xLuceneFieldType.String },
        { foo: /[a-z]+/ }],
    ['example:/foo:bar/',
        'a regexp with a colon',
        {
            type: NodeType.Regexp,
            field_type: xLuceneFieldType.String,
            field: 'example',
            value: { type: 'value', value: 'foo:bar' },
        } as Regexp],
    ['example:/0-9+\\//',
        'regex with an escaped forward slash',
        {
            type: NodeType.Regexp,
            field_type: xLuceneFieldType.String,
            field: 'example',
            value: { type: 'value', value: '0-9+\\/' },
        } as Regexp],
] as TestCase[];

export const filterNilRegex: TestCase[] = [
    [
        'example:/[a-z]+/ OR $bar AND $foo',
        'a basic regexp',
        {
            type: NodeType.Regexp,
            field_type: xLuceneFieldType.String,
            field: 'example',
            value: { type: 'value', value: '[a-z]+' }
        } as Regexp,
        { example: xLuceneFieldType.String }
    ],
    [
        'example: $bar OR $foo',
        'a basic regexp as variable',
        {
            type: NodeType.Term,
            value: { type: 'variable', scoped: false, value: 'foo' },
        } as Term,
        { example: xLuceneFieldType.String },
        { foo: /[a-z]+/ },
        {
            type: NodeType.Regexp,
            value: { type: 'value', value: '[a-z]+' },
        } as Regexp,
    ],
];
