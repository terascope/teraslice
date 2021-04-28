import { FieldType } from '@terascope/types';
import { FieldTransformConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

export interface ReplaceLiteralArgs {
    search: string;
    replace: string;
}

export const replaceLiteralConfig: FieldTransformConfig<ReplaceLiteralArgs> = {
    name: 'replaceLiteral',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Replaces the searched value with the replace value',
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
