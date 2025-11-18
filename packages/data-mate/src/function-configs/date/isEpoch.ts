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
    accepts: [FieldType.Number],
};
