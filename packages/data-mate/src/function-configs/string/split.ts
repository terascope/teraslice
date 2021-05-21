import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionExample, FunctionDefinitionCategory
} from '../interfaces';

export interface SplitArgs {
    delimiter?: string;
}

const examples: FunctionDefinitionExample<SplitArgs>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'astring',
        output: ['a', 's', 't', 'r', 'i', 'n', 'g']
    },
    {
        args: { delimiter: ',' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'astring',
        output: ['astring'],
        description: 'Delimiter is not found so the whole input is returned'
    },
    {
        args: { delimiter: '-' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'a-stri-ng',
        output: ['a', 'stri', 'ng']
    },
    {
        args: { delimiter: ' ' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'a string',
        output: ['a', 'string']
    },
];

export const splitConfig: FieldTransformConfig<SplitArgs> = {
    name: 'split',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts a string to an array of characters split by the delimiter provided, defaults to splitting up every char',
    examples,
    create({ args: { delimiter = '' } }) {
        return splitFn(delimiter);
    },
    accepts: [FieldType.String],
    argument_schema: {
        delimiter: {
            type: FieldType.String,
            array: false,
            description: 'The char used to identify where to split the string'
        }
    },
    output_type({ field_config }) {
        return {
            field_config: {
                ...field_config,
                array: true,
            }
        };
    }
};

function splitFn(delimiter: string): (input: unknown) => string[] {
    return function _split(input) {
        return String(input).split(delimiter);
    };
}
