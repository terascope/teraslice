import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionExample, FunctionDefinitionCategory,
} from '../interfaces.js';
import { sqlLiteral } from '../sql-helpers.js';

export interface ReplaceLiteralArgs {
    search: string;
    replace: string;
}

const examples: FunctionDefinitionExample<ReplaceLiteralArgs>[] = [
    {
        args: { search: 'bob', replace: 'mel' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'Hi bob',
        output: 'Hi mel'
    },
    {
        args: { search: 'bob', replace: 'mel' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'Hi Bob',
        output: 'Hi Bob',
        description: 'Does not replace as it is not an exact match'
    },
];

export const replaceLiteralConfig: FieldTransformConfig<ReplaceLiteralArgs> = {
    name: 'replaceLiteral',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns a string with the searched value replaced by the replace value',
    examples,
    create({ args: { replace, search } }) {
        return (input: unknown) => replaceFn(input as string, search, replace);
    },
    /**
     * Replaces the first occurrence only, so SQL's `replace()`, which replaces every occurrence,
     * does not fit.
     *
     * `replaceFn` is `input.replace(search, newVal)` with a string search value, which replaces
     * only the first match. With `search: 'e'` and `replace: 'E'`, JavaScript turns `'Hey There'`
     * into `'HEy There'`.
     *
     * The SQL uses `position` and `substring` rather than `regexp_replace`, which would require
     * escaping the search value as a regex and the replacement against backreference syntax.
     * `position` returns 0 when the search value is absent.
    */
    sql: {
        expression: ({ value, args }) => {
            const needle = sqlLiteral(args.search);
            const at = `position(${needle} IN ${value})`;
            return `CASE WHEN ${at} = 0 THEN ${value}`
                + ` ELSE substring(${value}, 1, ${at} - 1) || ${sqlLiteral(args.replace)}`
                + ` || substring(${value}, ${at} + length(${needle})) END`;
        },
    },
    accepts: [FieldType.String],
    argument_schema: {
        search: {
            type: FieldType.String,
            array: false,
            description: 'The characters that will be replaced'
        },
        replace: {
            type: FieldType.String,
            array: false,
            description: 'The value that will replace what is set in search'
        }
    },
    required_arguments: ['search', 'replace']
};

function replaceFn(input: string, search: string, newVal: string) {
    return input.replace(search, newVal);
}
