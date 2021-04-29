import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionExample
} from '../interfaces';

export interface SplitStringArgs {
    delimiter?: string;
}

const examples: FunctionDefinitionExample<SplitStringArgs>[] = [
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
        description: 'Delimiter is not found, so it is not split'
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

export const splitStringConfig: FieldTransformConfig<SplitStringArgs> = {
    name: 'splitString',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: ' Converts a string to an array of characters split by the delimiter provided, defaults to splitting up every char',
    examples,
    create({ delimiter = '' }) {
        return (input: unknown) => splitFn(input as string, delimiter);
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

function splitFn(input: string, delimiter: string) {
    input.split(delimiter);
}
