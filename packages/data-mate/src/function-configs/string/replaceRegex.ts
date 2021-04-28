import { isString, isRegExpLike } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { FieldTransformConfig, ProcessMode, FunctionDefinitionType } from '../interfaces';

export interface ReplaceRegexArgs {
    regex: string;
    replace: string;
    ignoreCase?: boolean;
    global?: boolean
}

export const replaceLRegexConfig: FieldTransformConfig<ReplaceRegexArgs> = {
    name: 'replaceRegex',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'This function replaces chars in a string based off the regex value provided',
    create({
        replace,
        regex,
        ignoreCase = false,
        global = false
    }) {
        return (input: unknown) => replaceFn(input as string, replace, regex, ignoreCase, global);
    },
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
            description: 'the value that will replace what is found by the regex'
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
