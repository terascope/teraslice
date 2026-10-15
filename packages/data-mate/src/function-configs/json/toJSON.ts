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
         * `to_json`, which matches `JSON.stringify` for the column types in `JSON_SQL_TYPES`,
         * including the escaping of quotes, tabs, backslashes and astral characters.
         * `JSON_SQL_TYPES` explains which types stay on the UDF and why.
         *
         * An array column is declined because `output_type` declares a non-array result.
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
