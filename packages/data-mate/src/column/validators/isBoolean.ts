import * as ts from '@terascope/utils';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Validates that the input is a boolean
 *
 * @example
 *
 *     isBoolean
 *       // true => true
 *       // false => true
 *       // 'some-string' => false
 *       // 0 => false
 */
export const isBooleanConfig: ColumnValidateConfig<any> = {
    type: TransformType.VALIDATE,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: ts.isBoolean
        };
    },
    description: 'Validates that the input is a boolean',
    accepts: [],
    argument_schema: {},
};
