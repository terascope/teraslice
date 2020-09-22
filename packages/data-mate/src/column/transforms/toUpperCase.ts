import * as ts from '@terascope/utils';
import { isString } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnFnMode, ColumnTransformConfig } from '../interfaces';

/**
 * Converts strings to upper case
 *
 * @example
 *
 *     toUpperCase('lowercase'); // 'LOWERCASE';
 *     toUpperCase(['MixEd', null, 'lower']); // ['MIXED', 'LOWER'];
 */
export function toUpperCase(input: string): string {
    if (!isString(input)) {
        throw new Error(`Input must be a string, received ${ts.getTypeOf(input)}`);
    }

    return input.toUpperCase();
}

export const toUpperCaseConfig: ColumnTransformConfig<string> = {
    fn() {
        return {
            mode: ColumnFnMode.EACH_VALUE,
            fn: toUpperCase
        };
    },
    description: 'Converts strings to upper case',
    accepts: [VectorType.String],
};
