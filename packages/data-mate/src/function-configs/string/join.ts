import { FieldType } from '@terascope/types';
import { isNotNil } from '@terascope/core-utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionExample, FunctionDefinitionCategory
} from '../interfaces.js';
import { sqlLiteral, STRING_FIELD_TYPES } from '../sql-helpers.js';

export interface JoinArgs {
    delimiter?: string;
}

const examples: FunctionDefinitionExample<JoinArgs>[] = [
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String, array: true
                }
            }
        },
        field: 'testField',
        input: ['a', ' ', 's', 't', 'r', 'i', 'n', 'g'],
        output: 'a string',
    },
    {
        args: { delimiter: ',' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String, array: true
                }
            }
        },
        field: 'testField',
        input: ['a string', 'found'],
        output: 'a string,found',
    },
    {
        args: { delimiter: ' - ' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String, array: true
                }
            }
        },
        field: 'testField',
        input: ['a', 'stri', 'ng'],
        output: 'a - stri - ng',
    },
    {
        args: { delimiter: ' ' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String, array: true
                }
            }
        },
        field: 'testField',
        input: 'a string',
        output: 'a string',
    },
    {
        args: { delimiter: ':' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Tuple
                },
                'testField.0': {
                    type: FieldType.String
                },
                'testField.1': {
                    type: FieldType.Byte
                },
                'testField.2': {
                    type: FieldType.Boolean
                }
            }
        },
        field: 'testField',
        input: ['foo', 1, true],
        output: 'foo:1:true',
    },
];

export const joinConfig: FieldTransformConfig<JoinArgs> = {
    name: 'join',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns a string from an array of values joined by the delimiter.',
    examples,
    create({ args: { delimiter = '' } }) {
        return joinFn(delimiter);
    },
    /**
     * `array_to_string` over the non-null elements, which is `input.filter(isNotNil).join(d)`.
     *
     * Verified against the JavaScript: an empty list and an all-null list both give `''` on either
     * side, and an empty delimiter concatenates. `applies` claims only a STRING-element array -
     * for numbers and booleans `join` uses `String(x)` and SQL would use DuckDB's cast, and there
     * is no reason to assume those agree on something like `1e21`.
     *
     * Array-only for the same reason as the `*Values` reducers, plus one of its own: on a scalar
     * column `_join` returns `String(input)`, which is a cast rather than a join.
    */
    sql: {
        applies: (_args, inputConfig) => inputConfig?.field_config?.array === true
            && STRING_FIELD_TYPES.includes(inputConfig.field_config.type as FieldType),
        expression: ({ value, args }) => 'array_to_string('
            + `list_filter(${value}, lambda x : x IS NOT NULL),`
            + ` ${sqlLiteral((args.delimiter as string) ?? '')})`,
    },
    accepts: [FieldType.String, FieldType.Number, FieldType.Boolean],
    argument_schema: {
        delimiter: {
            type: FieldType.String,
            array: false,
            description: 'The char to join the strings'
        }
    },
    output_type() {
        return {
            field_config: {
                type: FieldType.String,
                array: false,
            }
        };
    }
};

function joinFn(delimiter: string): (input: unknown) => string | null {
    return function _join(input) {
        if (input == null) return null;
        if (!Array.isArray(input)) {
            return String(input);
        }
        return input.filter(isNotNil).join(delimiter);
    };
}
