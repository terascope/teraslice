import { DateFormat, FieldType, TimeResolution } from '@terascope/types';
import { isUnixTimeFP } from '@terascope/utils';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces';

export interface IsEpochArgs {
    allowBefore1970?: boolean;
}

export const isEpochConfig: FieldValidateConfig<IsEpochArgs> = {
    name: 'isEpoch',
    aliases: ['isUnixTime'],
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.DATE,
    description: 'Checks to see if input is a valid epoch timestamp. Accuracy is not guaranteed since it is just a number.',
    examples: [{
        args: { },
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2019-10-22',
        output: null
    }, {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.Number } }
        },
        field: 'testField',
        input: 102390933,
        output: 102390933
    }, {
        args: {},
        config: {
            version: 1,
            fields: { testField: { type: FieldType.String } }
        },
        field: 'testField',
        input: '2001-01-01T01:00:00.000Z',
        output: null
    }, {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Date,
                    format: DateFormat.milliseconds
                }
            }
        },
        field: 'testField',
        input: 102390933,
        output: null
    }, {
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
    }, {
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
    }, {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Date,
                    time_resolution: TimeResolution.MILLISECONDS
                }
            }
        },
        field: 'testField',
        input: 102390933,
        output: null
    }],
    argument_schema: {
        allowBefore1970: {
            type: FieldType.Boolean,
            description: 'Set to false to disable allowing negative values'
        }
    },
    create({ allowBefore1970 }, inputConfig) {
        if (
            inputConfig?.field_config?.type === FieldType.Date && (
                inputConfig.field_config.format === DateFormat.epoch_millis
                || inputConfig.field_config.format === DateFormat.milliseconds
                || inputConfig.field_config.time_resolution === TimeResolution.MILLISECONDS
            )
        ) {
            return alwaysFalse;
        }
        return isUnixTimeFP(allowBefore1970);
    },
    accepts: [FieldType.Date, FieldType.String, FieldType.Number],
};

function alwaysFalse(): boolean {
    return false;
}
