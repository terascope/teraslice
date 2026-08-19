import { isString, isRegExpLike } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionExample, FunctionDefinitionCategory,
} from '../interfaces.js';
import { sqlLiteral } from '../sql-helpers.js';
import { isRe2Safe, isLiteralReplacement } from './sql-utils.js';

export interface ReplaceRegexArgs {
    regex: string;
    replace: string;
    ignoreCase?: boolean;
    global?: boolean;
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

export const replaceRegexConfig: FieldTransformConfig<ReplaceRegexArgs> = {
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
    /**
     * `regexp_replace`, guarded on both the pattern and the replacement.
     *
     * Verified identical over six patterns - anchors, classes, quantifiers, the `i` and `g` flags -
     * and the two things that break it are guarded in `sql-utils.ts`: **RE2 has no lookaround or
     * backreferences and ERRORS rather than differing**, and **`$1` is a capture group in
     * JavaScript and a literal in SQL**.
    */
    sql: {
        applies: (args) => typeof args.regex === 'string'
            && isRe2Safe(args.regex)
            && isLiteralReplacement(String(args.replace ?? '')),
        expression: ({ value, args }) => {
            const flags = `${args.ignoreCase ? 'i' : ''}${args.global ? 'g' : ''}`;
            const rest = flags ? `, ${sqlLiteral(flags)}` : '';
            return `regexp_replace(${value}, ${sqlLiteral(args.regex as string)},`
                + ` ${sqlLiteral(String(args.replace ?? ''))}${rest})`;
        },
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
    // cannot check for empty string, which is valid in this case, so we cannot specify replace
    required_arguments: ['regex'],
    validate_arguments({ regex, replace }) {
        if (!isString(regex) || isRegExpLike(regex)) {
            throw new Error('Parameters "regex" must be provided and be a valid regex expression');
        }
        if (!isString(replace)) {
            throw new Error('Parameters "replace" must be provided and be a valid string');
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
