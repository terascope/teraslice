import * as ts from '@terascope/utils';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Validates that the input is a like a boolean
 *
 * @example
 *
 *     isBooleanLike(); // false
 *     isBooleanLike(null); // true
 *     isBooleanLike(0); // true
 *     isBooleanLike('0'); // true
 *     isBooleanLike('false'); // true
 *     isBooleanLike('no'); // true
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
