import {
    isBigInt, bigIntToJSON, isNil,
    isObjectEntity, toJSONCompatibleValue
} from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory
} from '../interfaces.js';
import { JSON_SQL_TYPES } from './sql-utils.js';

export const toJSONConfig: FieldTransformConfig = {
    name: 'toJSON',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    description: 'Converts whole input to JSON format',
    category: FunctionDefinitionCategory.JSON,
    examples: [
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.Long
                    }
                }
            },
            field: 'testField',
            input: BigInt(21) ** BigInt(20),
            output: '278218429446951548637196400'
        },
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.Boolean
                    }
                }
            },
            field: 'testField',
            input: false,
            output: 'false'
        },
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.Object
                    }
                }
            },
            field: 'testField',
            input: { some: 1234 },
            output: '{"some":1234}'
        },
        {
            args: {},
            config: {
                version: 1,
                fields: {
                    testField: {
                        type: FieldType.Object
                    }
                }
            },
            field: 'testField',
            input: { bigNum: BigInt(21) ** BigInt(20) },
            output: '{"bigNum":"278218429446951548637196400"}'
        },
    ],
    create() {
        return (input: unknown) => {
            if (isNil(input)) return null;

            if (isBigInt(input)) {
                return bigIntToJSON(input);
            }

            if (isObjectEntity(input)) {
                const parsedData = toJSONCompatibleValue(input);
                return JSON.stringify(parsedData);
            }

            return JSON.stringify(input);
        };
    },
    sql: {
        /**
         * **`to_json` is `JSON.stringify`, for most column types.** Measured over 13 values across
         * six types (`tools/probe/remaining-26.mjs`): every VARCHAR case byte-equal including
         * quotes, tabs, backslashes and astral input; BIGINT, BOOLEAN and non-integral DOUBLE
         * equal; STRUCT and LIST equal including key ORDER.
         *
         * Two type families are declined for measured reasons, not caution:
         *
         * - **floating point.** `to_json(2.0)` is `'2.0'` where `JSON.stringify(2)` is `'2'`, and
         *   `to_json(1e21)` is `'1e21'` where JavaScript writes `'1e+21'`. That is JavaScript's
         *   number-to-string algorithm, not a formatting option, so it stays on the UDF.
         * - **Date.** `to_json` on a TIMESTAMP gives `"2026-01-02 03:04:05.678"` - no `T`, no `Z` -
         *   where `JSON.stringify(new Date(...))` gives the ISO form.
         *
         * An array column is declined because `output_type` declares the result `array: false`
         * while `list_transform` would hand back a list.
        */
        applies: (_args, inputConfig) => !inputConfig.field_config.array
            && JSON_SQL_TYPES.includes(inputConfig.field_config.type as FieldType),
        expression: ({ value }) => `CAST(to_json(${value}) AS VARCHAR)`,
    },
    accepts: [],
    output_type(_inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        return {
            field_config: {
                type: FieldType.String,
                array: false
            },
        };
    }
};
