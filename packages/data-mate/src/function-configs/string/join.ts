import { FieldType } from '@terascope/types';
import { isNotNil } from '@terascope/utils';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionExample, FunctionDefinitionCategory
} from '../interfaces';

export interface JoinArgs {
    delimiter?: string;
}

const examples: FunctionDefinitionExample<JoinArgs>[] = [
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String, array: true
                }
            }
        },
        field: 'testField',
        input: ['a', ' ', 's', 't', 'r', 'i', 'n', 'g'],
        output: 'a string',
    },
    {
        args: { delimiter: ',' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String, array: true
                }
            }
        },
        field: 'testField',
        input: ['a string', 'found'],
        output: 'a string,found',
    },
    {
        args: { delimiter: ' - ' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String, array: true
                }
            }
        },
        field: 'testField',
        input: ['a', 'stri', 'ng'],
        output: 'a - stri - ng',
    },
    {
        args: { delimiter: ' ' },
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String, array: true
                }
            }
        },
        field: 'testField',
        input: 'a string',
        output: 'a string',
    },
];

export const joinConfig: FieldTransformConfig<JoinArgs> = {
    name: 'join',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts an array of string values joins by the delimiter provided',
    examples,
    create({ delimiter = '' }) {
        return joinFn(delimiter);
    },
    accepts: [FieldType.String],
    argument_schema: {
        delimiter: {
            type: FieldType.String,
            array: false,
            description: 'The char to join the strings'
        }
    },
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                array: false,
            }
        };
    }
};

function joinFn(delimiter: string): (input: unknown) => string|null {
    return function _join(input) {
        if (input == null) return null;
        if (!Array.isArray(input)) {
            return String(input);
        }
        return input.filter(isNotNil).join(delimiter);
    };
}
