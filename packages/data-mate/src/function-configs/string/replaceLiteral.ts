import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionExample, FunctionDefinitionCategory
} from '../interfaces';

export interface ReplaceLiteralArgs {
    search: string;
    replace: string;
}

const examples: FunctionDefinitionExample<ReplaceLiteralArgs>[] = [
    {
        args: { search: 'bob', replace: 'mel' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'Hi bob',
        output: 'Hi mel'
    },
    {
        args: { search: 'bob', replace: 'mel' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'Hi Bob',
        output: 'Hi Bob',
        description: 'Does not replace as it is not an exact match'
    },
];

export const replaceLiteralConfig: FieldTransformConfig<ReplaceLiteralArgs> = {
    name: 'replaceLiteral',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Replaces the searched value with the replace value',
    examples,
    create({ replace, search }) {
        return (input: unknown) => replaceFn(input as string, search, replace);
    },
    accepts: [FieldType.String],
    argument_schema: {
        search: {
            type: FieldType.String,
            array: false,
            description: 'The word that will be replaced'
        },
        replace: {
            type: FieldType.String,
            array: false,
            description: 'the value that will replace what is set in search'
        }
    },
    required_arguments: ['search', 'replace']
};

function replaceFn(input: string, search: string, newVal: string) {
    return input.replace(search, newVal);
}
