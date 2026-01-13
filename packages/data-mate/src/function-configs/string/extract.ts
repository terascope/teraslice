import { isNil, matchAll } from '@terascope/core-utils';
import { FieldType, ReadonlyDataTypeConfig } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    DataTypeFieldAndChildren,
    FunctionDefinitionCategory,
    FunctionDefinitionExample,
} from '../interfaces.js';

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
