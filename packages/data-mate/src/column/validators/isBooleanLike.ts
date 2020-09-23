import * as ts from '@terascope/utils';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Validates that the input is a like a boolean
 *
 * @example
 *
 *     isBooleanLike()
 *       // 0 => true
 *       // 1 => true
 *       // '0' => true
 *       // '1' => true
 *       // 'yes' => true
 *       // true => true
 *       // 'False' => true
 *       // 'SOME_VALUE' => false
 *       // -1 => false
 */
export const isBooleanLikeConfig: ColumnValidateConfig<any> = {
    type: TransformType.VALIDATE,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: ts.isBooleanLike
        };
    },
    description: 'Validates that the input is like a boolean',
    accepts: [],
    argument_schema: {},
};
