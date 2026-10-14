import { truncateFP } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { sqlLiteral, HAS_ASTRAL, needsNumericArgs } from '../sql-helpers.js';

export interface TruncateConfig {
    size: number;
}

export const truncateConfig: FieldTransformConfig<TruncateConfig> = {
    name: 'truncate',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Limits the size of the input string to a specific length, if the length is greater than the specified size, the excess is removed',
    examples: [
        {
            args: { size: 4 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'thisisalongstring',
            output: 'this'
        },
        {
            args: { size: 8 },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'Hello world',
            output: 'Hello wo'
        },
    ],
    create({ args: { size } }) {
        return truncateFP(size, false) as (value: unknown) => string;
    },
    /**
     * `substring` for values without astral characters, the UDF otherwise.
     *
     * `truncateFP` counts UTF-16 code units and `substring` counts characters. Truncating four
     * thumbs-up emoji to 3 gives one emoji plus a lone surrogate in JavaScript and three whole
     * emoji in SQL, so astral input keeps the UDF.
    */
    sql: {
        applies: needsNumericArgs('size'),
        needs_udf_fallback: true,
        expression: ({ value, args, udf }) => `CASE WHEN regexp_matches(${value},`
            + ` ${sqlLiteral(HAS_ASTRAL)}) THEN ${udf(value)}`
            + ` ELSE substring(${value}, 1, ${Number(args.size)}) END`,
    },
    accepts: [FieldType.String],
    required_arguments: ['size'],
    argument_schema: {
        size: {
            type: FieldType.Number,
            array: false,
            description: 'How long the string should be'
        }
    },
    validate_arguments(args) {
        if (args.size <= 0) {
            throw new Error(`Invalid parameter size, expected a positive integer, got ${args.size}`);
        }
    }
};
