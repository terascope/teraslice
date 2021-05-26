import { isString, isRegExpLike } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionExample, FunctionDefinitionCategory
} from '../interfaces';

export interface ReplaceRegexArgs {
    regex: string;
    replace: string;
    ignoreCase?: boolean;
    global?: boolean
}

const examples: FunctionDefinitionExample<ReplaceRegexArgs>[] = [
    {
        args: { regex: 's|e', replace: 'd' },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'somestring',
        output: 'domestring'
    },
    {
        args: { regex: 's|e', replace: 'd', global: true },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'somestring',
        output: 'domddtring'
    },
    {
        args: {
            regex: 'm|t', replace: 'W', global: true, ignoreCase: true
        },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'soMesTring',
        output: 'soWesWring'
    },
    {
        args: { regex: '\\*', replace: '', global: true },
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'a***a***a',
        output: 'aaa'
    },
];

export const replaceLRegexConfig: FieldTransformConfig<ReplaceRegexArgs> = {
    name: 'replaceRegex',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns a string with the characters matched by the regex replaced with the args replace value',
    create({
        args: {
            replace,
            regex,
            ignoreCase = false,
            global = false
        }
    }) {
        return (input: unknown) => replaceFn(input as string, replace, regex, ignoreCase, global);
    },
    examples,
    accepts: [FieldType.String],
    argument_schema: {
        regex: {
            type: FieldType.String,
            array: false,
            description: 'The regex expression to execute'
        },
        replace: {
            type: FieldType.String,
            array: false,
            description: 'The value that will replace what is found by the regex'
        },
        ignoreCase: {
            type: FieldType.Boolean,
            array: false,
            description: 'Options flag for regex if it should ignore case, defaults to false'
        },
        global: {
            type: FieldType.Boolean,
            array: false,
            description: 'Options flag for regex to execute as many instances as is found, defaults to false'
        }
    },
    required_arguments: ['regex', 'replace'],
    validate_arguments({ regex }) {
        if (!isString(regex) || isRegExpLike(regex)) {
            throw new Error('Parameters "regex" must be provided and be a valid regex expression');
        }
    }
};

function replaceFn(
    input: string,
    replace: string,
    regex: string,
    ignoreCase: boolean,
    global: boolean
) {
    let options = '';

    if (ignoreCase) options += 'i';
    if (global) options += 'g';

    const re = new RegExp(regex, options);
    return input.replace(re, replace);
}
