import { FieldType } from '@terascope/types';
import { stringEntropy, StringEntropy } from '@terascope/core-utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { shannonEntropySql } from './sql-utils.js';
import { HAS_ASTRAL, sqlLiteral } from '../sql-helpers.js';

export interface EntropyArgs {
    algo?: string;
}

export const entropyConfig: FieldTransformConfig<EntropyArgs> = {
    name: 'entropy',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Calculates the entropy of a given string',
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.String
                    }
                }
            },
            field: 'testField',
            input: '0123456789abcdef',
            output: 4,
        },
        {
            args: { algo: StringEntropy.shannon },
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.String
                    }
                }
            },
            field: 'testField',
            input: '1223334444',
            output: 1.8464393446710154
        },
        {
            args: { algo: 'unknownAlgoName' },
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.String
                    }
                }
            },
            field: 'testField',
            input: '1223334444',
            output: null,
            fails: true,
        },
    ],
    create({ args: { algo = StringEntropy.shannon } }) {
        return stringEntropy(algo as StringEntropy);
    },
    sql: {
        /**
         * **Per-character aggregation inside a scalar expression, which was the stated wall.**
         * `string_split` to a list, `list_filter` to count each distinct character, `list_reduce`
         * to fold the terms - see `shannonEntropySql`. Measured EXACT, not approximate, on nine
         * inputs including the empty string and non-ASCII.
         *
         * `shannon` is the only algorithm in `StringEntropyDict` and anything else THROWS, so
         * `applies` claims it and nothing more. Astral input keeps the UDF: the JavaScript builds
         * its frequency table over CODE POINTS and divides by `input.length`, which counts CODE
         * UNITS, and the emission is not going to reproduce that inconsistency.
        */
        needs_udf_fallback: true,
        applies: ({ algo }) => algo == null || algo === StringEntropy.shannon,
        expression: ({ value, udf }) => `CASE WHEN regexp_matches(${value},`
            + ` ${sqlLiteral(HAS_ASTRAL)}) THEN ${udf(value)}`
            + ` ELSE ${shannonEntropySql(value)} END`,
    },
    accepts: [FieldType.String],
    argument_schema: {
        algo: {
            type: FieldType.String,
            array: false,
            description: `The algorithm to use, defaults to "${StringEntropy.shannon}"`
        },
    },
    required_arguments: [],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config, child_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.Number
            },
            child_config
        };
    }
};
