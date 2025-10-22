import {
    FieldType,
} from '@terascope/types';
import {
    castArray
} from '@terascope/core-utils';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface SetDefaultArgs {
    value: unknown;
}

export const setDefaultConfig: FieldTransformConfig<SetDefaultArgs> = {
    name: 'setDefault',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.JSON,
    description: 'Replaces missing values in a column with a constant value',
    examples: [
        {
            args: { value: 'example' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String } }
            },
            field: 'testField',
            input: null,
            output: 'example',
        },
        {
            args: { value: 'example' },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.String, array: true } }
            },
            field: 'testField',
            input: null,
            output: ['example'],
        }
    ],
    create({ args, inputConfig }) {
        let isListValue = inputConfig?.field_config?.array;
        return function setDefault(value) {
            if (isListValue == null && Array.isArray(value)) {
                isListValue = true;
            }
            if (isListValue) {
                if (value == null) return [args.value];
                const result = [];
                for (const val of castArray(value)) {
                    result.push(val != null ? val : args.value);
                }
                return result;
            }
            return value != null ? value : args.value;
        };
    },
    accepts: [],
    argument_schema: {
        value: {
            type: FieldType.Any,
            description: 'The default value to use'
        }
    },
    required_arguments: ['value'],
    output_type(inputConfig) {
        const { field_config } = inputConfig;

        return {
            field_config: {
                description: field_config.description,
                array: field_config.array,
                type: FieldType.Keyword
            },
        };
    }
};
