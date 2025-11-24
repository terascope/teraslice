import { subDays } from 'date-fns/subDays';
import { addDays } from 'date-fns/addDays';
import { xLuceneFieldType } from '@terascope/types';
import { escapeString } from '@terascope/core-utils';
import { NodeType, Term } from '../../src/index.js';
import { TestCase } from './interfaces.js';

export default [
    [
        'bar',
        'an unquoted string',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: null,
            value: { type: 'value', value: 'bar' },
        } as Term,
    ],
    [
        'foo bar',
        'an unquoted/un-grouped string',
        {
            type: NodeType.LogicalGroup,
            flow: [
                {
                    type: NodeType.Conjunction,
                    nodes: [{
                        type: NodeType.Term,
                        field_type: xLuceneFieldType.String,
                        quoted: false,
                        field: null,
                        value: { type: 'value', value: 'foo' },
                    }]
                },
                {
                    type: NodeType.Conjunction,
                    nodes: [{
                        type: NodeType.Term,
                        field_type: xLuceneFieldType.String,
                        quoted: false,
                        field: null,
                        value: { type: 'value', value: 'bar' },
                    }]
                }
            ]
        },
    ],
    [
        '"foo"',
        'a quoted string',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: null,
            quoted: true,
            value: { type: 'value', value: 'foo' },
        },
    ],
    [
        '\'foo\'',
        'a quoted string',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: null,
            quoted: true,
            value: { type: 'value', value: 'foo' },
        },
    ],
    [
        '\\"foo\\"',
        'an escaped quoted string',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: null,
            quoted: false,
            value: { type: 'value', value: '\\"foo\\"' },
        },
    ],
    [
        'foo:\\"bar\\"',
        'field with escaped quoted string',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: false,
            value: { type: 'value', value: '\\"bar\\"' },
        },
    ],
    [
        'foo:\\"bar',
        'field with one escaped quoted string',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: false,
            value: { type: 'value', value: '\\"bar' },
        },
        {
            foo: xLuceneFieldType.String
        }
    ],
    [
        'foo:"\\""',
        'field with using a quoted escaped quote',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: true,
            value: { type: 'value', value: '"' },
        },
        {
            foo: xLuceneFieldType.String
        }
    ],
    [
        'foo:bar',
        'field with string value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: false,
            value: { type: 'value', value: 'bar' },
        },
        {
            foo: xLuceneFieldType.String
        }
    ],
    [
        'phone.tokens:3848',
        'an analyzed field',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'phone.tokens',
            quoted: false,
            analyzed: true,
            value: { type: 'value', value: '3848' },
        },
        {
            phone: xLuceneFieldType.String
        }
    ],
    [
        'foo:   bar',
        'field with space between string value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: false,
            value: { type: 'value', value: 'bar' },
        },
    ],
    [
        'foo:"bar"',
        'field with quoted string value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: true,
            value: { type: 'value', value: 'bar' },
        },
        {
            foo: xLuceneFieldType.String
        }
    ],
    [
        'foo:\'bar\'',
        'field with single quoted string value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: true,
            value: { type: 'value', value: 'bar' },
        },
        {
            foo: xLuceneFieldType.String
        }
    ],
    [
        'count:123',
        'field with no type and unquoted integer value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.Integer,
            field: 'count',
            value: { type: 'value', value: 123 },
        },
    ],
    [
        'count:"123"',
        'field with no type and quoted integer value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'count',
            quoted: true,
            value: { type: 'value', value: '123' },
        },
    ],
    [
        'count:"123"',
        'field with integer type and quoted integer value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.Integer,
            field: 'count',
            value: { type: 'value', value: 123 },
        },
        {
            count: xLuceneFieldType.Integer
        }
    ],
    [
        'count:"22.5"',
        'field with integer type and quoted float value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.Integer,
            field: 'count',
            value: { type: 'value', value: 22 },
        },
        {
            count: xLuceneFieldType.Integer
        }
    ],
    [
        'count:22.5',
        'field with integer type and unquoted float value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.Integer,
            field: 'count',
            value: { type: 'value', value: 22 },
        },
        {
            count: xLuceneFieldType.Integer
        }
    ],
    [
        'count_str:123',
        'field with unquoted string type that is numeric',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'count_str',
            quoted: false,
            value: { type: 'value', value: '123' },
        },
        {
            count_str: 'string'
        }
    ],
    [
        'large_numeric_str:4555029426647693529',
        'field with unquoted string type that is large numeric value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'large_numeric_str',
            quoted: false,
            value: { type: 'value', value: '4555029426647693529' },
        },
        {
            large_numeric_str: 'string'
        }
    ],
    [
        'cash:50.50',
        'field with float value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.Float,
            field: 'cash',
            value: { type: 'value', value: 50.5 },
        },
        {
            cash: xLuceneFieldType.Float
        }
    ],
    [
        'cash:"50.50"',
        'field no type and quoted float value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'cash',
            quoted: true,
            value: { type: 'value', value: '50.50' },
        },
    ],
    [
        'cash:"50.50"',
        'field with float type and quoted float value',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.Float,
            field: 'cash',
            value: { type: 'value', value: 50.50 },
        },
        {
            cash: xLuceneFieldType.Float
        }
    ],
    [
        'bool:false',
        'field with bool false',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.Boolean,
            field: 'bool',
            value: { type: 'value', value: false },
        },
    ],
    [
        'bool:true',
        'field type of string with bool',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'bool',
            value: { type: 'value', value: 'true' },
        },
        {
            bool: xLuceneFieldType.String
        }
    ],
    [
        'bool:"false"',
        'field type of boolean with string "false"',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.Boolean,
            field: 'bool',
            value: { type: 'value', value: false },
        },
        {
            bool: xLuceneFieldType.Boolean
        }
    ],
    [
        'bool:"true"',
        'field with no type with a quoted boolean',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'bool',
            value: { type: 'value', value: 'true' },
        },
    ],
    [
        'fo?:bar',
        'field name with wildcard',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'fo?',
            value: { type: 'value', value: 'bar' },
        },
    ],
    [
        'foo:"ba?"',
        'field with q quoted wildcard',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: true,
            value: { type: 'value', value: 'ba?' },
        },
    ],
    [
        // FIXME
        '(155 223)',
        'a parens unquoted string',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: null,
            quoted: false,
            value: { type: 'value', value: '155 223' },
        },
    ],
    [
        '(foo:bar)',
        'a field value with parens',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            field: 'foo',
            quoted: false,
            value: { type: 'value', value: 'bar' },
        },
    ],
    [
        'id:some"thing"else',
        'an inner double quoted string string',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'id',
            value: { type: 'value', value: 'some"thing"else' },
        },
    ],
    [
        'field:"valueSomething(abcd70576983)"',
        'a double quoted value with unescaped parens',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'field',
            value: { type: 'value', value: 'valueSomething(abcd70576983)' },
        },
    ],
    [
        '"hi(hello)howdy"',
        'a field-less double quoted value with unescaped parens',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: null,
            value: { type: 'value', value: 'hi(hello)howdy' },
        },
    ],
    [
        'field:\' hello(123) there\'',
        'a single quoted value with unescaped parens',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'field',
            value: { type: 'value', value: ' hello(123) there' },
        },
    ],
    [
        '\' :(hello)\'',
        'a field-less single quoted value with unescaped parens',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: null,
            value: { type: 'value', value: ' :(hello)' },
        },
    ],
    [
        'example: \'+ -  ( ) { } [ ] ^ \\\' " ? & | / ~ * OR NOT\'',
        'a single quoted value with all of the reserved characters',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'example',
            value: { type: 'value', value: '+ -  ( ) { } [ ] ^ \' " ? & | / ~ * OR NOT' },
        },
    ],
    [
        'example: "+ -  ( ) { } [ ] ^ \' \\" ? & | / ~ * OR NOT" ',
        'a double quoted value with all of the reserved characters',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'example',
            value: { type: 'value', value: '+ -  ( ) { } [ ] ^ \' " ? & | / ~ * OR NOT' },
        },
    ],
    [
        'id:some\'other\'thing',
        'an inner single quoted string string',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'id',
            value: { type: 'value', value: 'some\'other\'thing' },
        },
    ],
    [
        `id:${escapeString('some\\"thing\\"else')}`,
        'an unquoted string with quotes inside',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'id',
            value: { type: 'value', value: 'some\\\\\\"thing\\\\\\"else' },
        },
    ],
    [
        'id:"some thing else"',
        'a quoted multiword string with spaces',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'id',
            value: { type: 'value', value: 'some thing else' },
        },
    ],
    [
        `id:"${escapeString('some \\"thing\\" else')}"`,
        'a double quoted value with escaped double quotes',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'id',
            value: { type: 'value', value: 'some \\"thing\\" else' },
        },
    ],
    [
        `id:'${escapeString('some\\ \\"thing\\" else')}'`,
        'a single quoted value with escaped double quotes and spaces',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'id',
            value: { type: 'value', value: 'some\\ \\"thing\\" else' },
        },
    ],
    [
        'foo:\'"bar"\'',
        'double quoted escaped value at start and end',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'foo',
            value: { type: 'value', value: '"bar"' },
        },
    ],
    [
        `foo:'${escapeString(`"ba\\'r"`)}'`,
        'value with single quotes at the start, middle and end',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'foo',
            value: { type: 'value', value: '"ba\\\'r"' },
        },
    ],
    [
        'foo:"\\"bar\\""',
        'double quoted escaped value at start and end',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'foo',
            value: { type: 'value', value: '"bar"' },
        },
    ],
    [
        `field:'${escapeString('/value\\\\')}'`,
        'single quoted value with ending double escape',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'field',
            value: { type: 'value', value: `/value\\\\` },
        },
    ],
    [
        `field:"${escapeString('/value\\\\')}"`,
        'double quoted value with ending double escape',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: true,
            field: 'field',
            value: { type: 'value', value: `/value\\\\` },
        },
    ],
    [
        `field:$bar_val`,
        'variable with value is a string',
        {
            value: { type: 'variable', value: 'bar_val' },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
        },
        {
            field: xLuceneFieldType.String
        },
    ],
    [
        `field:$bar`,
        'variable with value is a boolean',
        {
            value: { type: 'value', value: false },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.Boolean,
        },
        {
            field: xLuceneFieldType.Boolean,
        },
        {
            bar: false
        }
    ],
    [
        `field:$bar2`,
        'variable with value is a number',
        {
            value: { type: 'variable', value: 'bar2' },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.Integer,
        },
        {
            field: xLuceneFieldType.Integer,
        },
    ],
    [
        `field:@bar2`,
        'a scoped variable',
        {
            value: { type: 'variable', value: '@bar2', scoped: true },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.Integer,
        },
        {
            field: xLuceneFieldType.Integer,
        },
    ],
    [
        `field:@example.foo`,
        'a nested scoped variable',
        {
            value: { type: 'variable', value: '@example.foo', scoped: true },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
        },
        {
            field: xLuceneFieldType.String,
        },
    ],
    [
        `field:@bar_string`,
        'a scoped variable that gets translated',
        {
            value: { type: 'value', value: 'EXAMPLE' },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
        },
        {
            field: xLuceneFieldType.String,
        },
        {
            '@bar_string': 'EXAMPLE'
        }
    ],
    [
        `field:"@example.foo"`,
        'wont confuse quoted for scoped variable',
        {
            value: { type: 'value', value: '@example.foo' },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
        },
        {
            field: xLuceneFieldType.String,
        },
    ],
    [
        `field:\\@example.foo`,
        'wont confuse escaped value for scoped variable',
        {
            value: { type: 'value', value: '\\@example.foo' },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
        },
        {
            field: xLuceneFieldType.String,
        },
    ],
    [
        'field:something.com',
        'can parse string values with dots',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            restricted: true,
            field: 'field',
            value: { type: 'value', value: 'something.com' },
        },
    ],
    [
        'field:foo@something.com',
        'can parse an email',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            restricted: true,
            field: 'field',
            value: { type: 'value', value: 'foo@something.com' },
        },
    ],
    [
        'field:false.com',
        'can parse string values that have true/false in them',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'field',
            value: { type: 'value', value: 'false.com' },
        },
    ],
    [
        'field.right:false.com',
        'can parse string values that have true/false in them with fields that have dots',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'field.right',
            value: { type: 'value', value: 'false.com' },
        },
    ],
    [
        'field.right:3.com',
        'can parse string values that have integers in them',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'field.right',
            value: { type: 'value', value: '3.com' },
        },
    ],
    [
        'field.right:3.3.com',
        'can parse string values that have floats in them',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
            quoted: false,
            field: 'field.right',
            value: { type: 'value', value: '3.3.com' },
        },
    ],
    [
        'field:now-4d',
        'can coerce date math',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.Date,
            field: 'field',
            value: { type: 'value' },
        },
        {
            field: xLuceneFieldType.Date,
        },
        undefined,
        undefined,
        (now: Date, ast: Term) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astDate = new Date(ast.value.value.setUTCHours(0, 0, 0, 0));
            expect(astDate).toEqual(subDays(_now, 4));
        }
    ],
    [
        'field:$foo',
        'can coerce date math with variables',
        {
            type: NodeType.Term,
            field_type: xLuceneFieldType.Date,
            field: 'field',
            value: { type: 'value' },
        },
        {
            field: xLuceneFieldType.Date,
        },
        { foo: 'now+2d' },
        undefined,
        (now: Date, ast: Term) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astDate = new Date(ast.value.value.setUTCHours(0, 0, 0, 0));
            expect(astDate).toEqual(addDays(_now, 2));
        }
    ],
] as TestCase[];

export const filterNilTerm: TestCase[] = [
    [
        `field:$bar_val`,
        'returns empty node if variable not defined',
        {
            type: NodeType.Empty,
        },
        { field: xLuceneFieldType.String }
    ],
    [
        `field:@bar2`,
        'doesn\'t filter scoped variable',
        {
            value: { type: 'variable', value: '@bar2', scoped: true },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.Integer,
        } as Term,
        {
            field: xLuceneFieldType.Integer,
        },
    ],
    [
        `field:@example.foo`,
        'doesn\'t filter nested scoped variable',
        {
            value: { type: 'variable', value: '@example.foo', scoped: true },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
        } as Term,
        {
            field: xLuceneFieldType.String,
        }
    ],
    [
        `field:$bar OR $foo`,
        'resolves variables',
        {
            value: { type: 'variable', value: 'bar', scoped: false },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
        } as Term,
        { field: xLuceneFieldType.String },
        { bar: 'test' },
        {
            value: { type: 'value', value: 'test' },
            field: 'field',
            type: NodeType.Term,
            field_type: xLuceneFieldType.String,
        } as Term,
    ],
];
