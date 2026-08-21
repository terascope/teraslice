import { isNil, isRegExpLike, matchAll } from '@terascope/core-utils';
import { FieldType, ReadonlyDataTypeConfig } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory,
    FunctionDefinitionExample,
} from '../interfaces.js';
import {
    emptyToNull, extractMarkerAllSql, extractMarkerSql, extractRegexAllSql,
    extractRegexSql, isOneCodePoint
} from './sql-utils.js';
import { countGroups, hasPortableEscapes, isRe2Safe, needsClassGuard } from './sql-regex-utils.js';

export interface ExtractArgs {
    regex?: string;
    start?: string;
    end?: string;
    global?: boolean;
}

const globalDefault = false;
const field = 'test';
const config: ReadonlyDataTypeConfig = {
    version: 1,
    fields: {
        [field]: {
            type: FieldType.String
        }
    }
};

const examples: FunctionDefinitionExample<ExtractArgs>[] = [
    {
        args: { start: '<', end: '>' },
        config,
        field,
        input: '<hello>',
        output: 'hello'
    },
    {
        args: { regex: 'he.*' },
        config,
        field,
        input: 'hello',
        output: 'hello'
    },
    {
        args: { regex: '/([A-Z]\\w+)/', global: true },
        config,
        field,
        input: 'Hello World some other things',
        output: ['Hello', 'World']
    },
    {
        args: { start: '<', end: '>', global: true },
        config,
        field,
        input: '<hello> some stuff <world>',
        output: ['hello', 'world']
    },
];

export const extractConfig: FieldTransformConfig<ExtractArgs> = {
    name: 'extract',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    category: FunctionDefinitionCategory.STRING,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    description: 'Returns an extracted substring or an array of substrings from the input string',
    create({ args }) {
        return _extract(args);
    },
    sql: {
        /**
         * Both modes, built from what `_extract` and `matchAll` actually do rather than from the
         * names - the builders and every measurement are in `sql-utils.ts`.
         *
         * The guards, each earned:
         *
         * - **marker mode wants ONE CODE POINT per marker.** `_subSlice` compares `char === start`
         *   inside `for (const char of input)`, so a two-character `start` can never match and the
         *   function returns null for every row. A native `position()` WOULD find it, which is a
         *   different answer, not a slower one.
         * - **regex mode wants at most ONE capture group.** `matchAll` pushes every group of every
         *   match, interleaved; `regexp_extract_all` takes a single group index.
         * - **RE2 must compile it, AND its classes must mean the same thing.** `isRe2Safe` covers
         *   the first: lookaround and backreferences ERROR. The second is `needsClassGuard`, and
         *   here it DECLINES rather than guards - a pattern containing `.`, `\s`, `\S` or a
         *   negated class keeps the UDF outright. `replaceRegex` can guard the value and fall back
         *   per row; `extract` cannot, because under `global` it has no working UDF to fall back to
         *   (DF4), so the emission must be self-sufficient or absent. What that costs is `he.*`
         *   staying on the UDF; what it buys is never returning a different answer.
         * - **a FLAGGED pattern keeps the UDF.** `formatRegex` accepts the `/pattern/flags` form
         *   and `i`, `s`, `m` and `x` each change the match; `x` has no RE2 equivalent at all.
         *
         * `global: true` returns a LIST, so the emission is the only way that shape runs at all -
         * `scalarResultConfig` strips `array` from the UDF's return type and the registered
         * function promises a VARCHAR (known-defects DF4, the same wall `split` hit).
        */
        applies: ({ regex, start, end }) => {
            if (regex != null) {
                if (typeof regex !== 'string' || isRegExpLike(regex)) return false;
                const groups = countGroups(regex);
                return groups != null && groups <= 1
                    && isRe2Safe(regex) && hasPortableEscapes(regex)
                    && !needsClassGuard(regex);
            }
            return isOneCodePoint(start) && isOneCodePoint(end);
        },
        expression: ({
            value, args: {
                regex, start, end, global = globalDefault
            }
        }) => {
            if (regex == null) {
                return global
                    ? emptyToNull(extractMarkerAllSql(value, start as string, end as string))
                    : extractMarkerSql(value, start as string, end as string);
            }
            const group = countGroups(regex) as number;
            return global
                ? emptyToNull(extractRegexAllSql(value, regex, group))
                : extractRegexSql(value, regex, group);
        },
    },
    accepts: [FieldType.String],
    examples,
    output_type(inputConfig: DataTypeFieldAndChildren, args = {}): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;
        const { global = globalDefault } = args;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String,
                array: global
            },
        };
    },
    argument_schema: {
        regex: {
            type: FieldType.String,
            array: false,
            description: 'The regex expression to execute, if set, do not use "start/end"'
        },
        start: {
            type: FieldType.String,
            array: false,
            description: 'The char that acts as the starting boundary for extraction, this is only used with end, not regex'
        },
        end: {
            type: FieldType.String,
            array: false,
            description: 'The char that acts as the ending boundary for extraction, this is only used with start, not regex'
        },
        global: {
            type: FieldType.Boolean,
            array: false,
            description: 'If set to true, it will return an array of all possible extractions, defaults to false'
        }
    },
    validate_arguments({ regex, start, end }) {
        if (isNil(regex) && (isNil(start) || isNil(end))) {
            throw new Error('You must either specify a "regex" value or both a "start" and "end" for extraction');
        }
    }
};

function _extract(args: ExtractArgs) {
    const {
        regex, start, end, global = globalDefault
    } = args;

    if (regex) return extractByRegex(regex, global);
    if (start && end) return extractMarkers(start, end, global);

    throw new Error('Invalid config for extract, must provide either "regex" or "start" and "end"');
}

function extractByRegex(regex: RegExp | string, global: boolean) {
    return (input: unknown) => {
        const results = matchAll(regex, input as string);
        if (global) return results;

        return results ? results[0] : results;
    };
}

function extractMarkers(start: string, end: string, global: boolean) {
    return (input: unknown) => getSubslice(input as string, start, end, global);
}

function _subSlice(input: string, start: string, end: string): string[] {
    const results: string[] = [];
    let sequenceFound = false;
    let item = '';

    for (const char of input) {
        if (sequenceFound && char === end) {
            sequenceFound = false;
            results.push(item);
            item = '';
        } else if (sequenceFound) {
            item += char;
        } else if (char === start) {
            sequenceFound = true;
        }
    }

    return results;
}

function getSubslice(input: string, start: string, end: string, global: boolean) {
    const results = _subSlice(input, start, end);

    if (results.length) {
        if (global) return results;
        return results[0];
    }

    return null;
}
