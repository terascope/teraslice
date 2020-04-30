import * as ts from '@terascope/utils';
import { AvailableType } from '@terascope/data-types';
import { Repository, InputType } from '../interfaces';
import { isArray } from '../validations/field-validator';

export const repository: Repository = {
    uniqueField: {
        fn: uniqueField,
        config: {},
        output_type: 'Any' as AvailableType,
        primary_input_type: InputType.Array
    },
    countField: {
        fn: countField,
        config: {},
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    }
};

export function uniqueField(input: any, _parentContext?: any) {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return ts.uniq(input);
    return input;
}

export function countField(input: any, _parentContext?: any) {
    if (ts.isNil(input)) return 0;
    if (isArray(input)) return input.length;
    return 1;
}

export function sumField(input: any, _parentContext?: any) {
    if (ts.isNil(input)) return 0;
    if (isArray(input)) return input.length;
    return 1;
}

export function avgField(input: any, _parentContext?: any) {
    if (ts.isNil(input)) return 0;
    if (isArray(input)) return input.length;
    return 1;
}

export function minField(input: any, _parentContext?: any) {
    if (ts.isNil(input)) return 0;
    if (isArray(input)) return input.length;
    return 1;
}

export function maxField(input: any, _parentContext?: any) {
    if (ts.isNil(input)) return 0;
    if (isArray(input)) return input.length;
    return 1;
}
