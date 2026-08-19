import { FieldType } from '@terascope/types';
import { isUnixTimeFP } from '@terascope/core-utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface IsEpochArgs {
    allowBefore1970?: boolean;
}

export const isEpochConfig: FieldValidateConfig<IsEpochArgs> = {
    name: 'isEpoch',
    aliases: ['isUnixTime'],
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Returns the input if it is a valid epoch timestamp. Accuracy is not guaranteed since any number could be a valid epoch timestamp.',
    examples: [{
        args: { },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2019-10-22',
        output: null
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 102390933,
        output: 102390933
    },
    {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2001-01-01T01:00:00.000Z',
        output: null
    },
    {
        args: { allowBefore1970: false },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Number,
                }
            }
        },
        field: 'testField',
        input: -102390933,
        output: null
    },
    {
        args: { },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Number,
                }
            }
        },
        field: 'testField',
        input: -102390933,
        output: -102390933
    }],
    argument_schema: {
        allowBefore1970: {
            type: FieldType.Boolean,
            description: 'Set to false to disable allowing negative values'
        }
    },
    create({ args: { allowBefore1970 } }) {
        return isUnixTimeFP(allowBefore1970);
    },
    /**
     * `toInteger(x) !== false`, which for a numeric column is only about finiteness.
     *
     * Measured: `isUnixTime` accepts `0.5`, `12.7` and `1e21` - `toInteger` TRUNCATES toward zero
     * rather than rejecting a fraction, so `-0.6` becomes `0` and passes the `>= 0` test while
     * `-1.6` becomes `-1` and does not. That is why the guard is `trunc(x) >= 0` and not `x >= 0`.
    */
    sql: {
        expression: ({ value, args }) => (args.allowBefore1970 === false
            ? `(isfinite(${value}) AND trunc(${value}) >= 0)`
            : `isfinite(${value})`),
    },
    accepts: [FieldType.Number],
};
