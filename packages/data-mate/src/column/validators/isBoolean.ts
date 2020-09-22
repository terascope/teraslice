import * as ts from '@terascope/utils';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Validates that the input is a boolean
 *
 * @example
 *
 *     isBoolean(false); // true
 *     isBoolean('some-string'); // false
 *     isBoolean(0); // false
 */
export const isBooleanConfig: ColumnValidateConfig<unknown> = {
    type: TransformType.VALIDATE,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            skipNulls: true,
            fn: ts.isBoolean
        };
    },
    description: 'Validates that the input is a boolean',
    accepts: [],
    argument_schema: {},
};
