import { FieldType } from '@terascope/types';
import { stringEntropy, StringEntropy } from '@terascope/core-utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory,
} from '../interfaces.js';

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
