import * as ts from '@terascope/utils';
import { FieldType } from '@terascope/types';
import { Repository, InputType } from '../interfaces';
import { isArray } from '../validations/field-validator';

export const repository: Repository = {
    uniqueField: {
        fn: uniqueField,
        config: {},
        output_type: FieldType.Any,
        primary_input_type: InputType.Array
    },
    countField: {
        fn: countField,
        config: {},
        output_type: FieldType.Integer,
        primary_input_type: InputType.Array
    },
    sumField: {
        fn: sumField,
        config: {},
        output_type: FieldType.Integer,
        primary_input_type: InputType.Array
    },
    avgField: {
        fn: avgField,
        config: {},
        output_type: FieldType.Integer,
        primary_input_type: InputType.Array
    },
    minField: {
        fn: minField,
        config: {},
        output_type: FieldType.Integer,
        primary_input_type: InputType.Array
    },
    maxField: {
        fn: maxField,
        config: {},
        output_type: FieldType.Integer,
        primary_input_type: InputType.Array
    }
};

export function uniqueField(input: unknown, _parentContext?: unknown): any[]|any|null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return ts.uniq(input);
    return input;
}

export function countField(input: unknown, _parentContext?: unknown): any[]|any|null {
    if (ts.isNil(input)) return 0;
    if (isArray(input)) return input.length;
    return 1;
}

export function sumField(input: unknown, _parentContext?: unknown): any[]|any|null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) {
        return input
            .filter(ts.isNumber)
            .reduce((prev, curr) => prev + curr, 0);
    }

    if (ts.isNumber(input)) return input;
    return null;
}

export function avgField(input: unknown, _parentContext?: unknown): any[]|any|null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) {
        const numbers = input
            .filter(ts.isNumber);

        const { length } = numbers;

        if (length === 0) return 0;
        return numbers.reduce((prev, curr) => prev + curr, 0) / length;
    }

    if (ts.isNumber(input)) return input;
    return null;
}

export function minField(input: unknown, _parentContext?: unknown): any[]|any|null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) {
        const numbers = input.filter(ts.isNumber);
        return Math.min.apply(null, numbers);
    }

    if (ts.isNumber(input)) return input;
    return null;
}

export function maxField(input: unknown, _parentContext?: unknown): any[]|any|null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) {
        const numbers = input.filter(ts.isNumber);
        return Math.max.apply(null, numbers);
    }

    if (ts.isNumber(input)) return input;
    return null;
}
