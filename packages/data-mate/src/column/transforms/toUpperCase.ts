import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Converts strings to upper case
 *
 * @example
 *
 *     toUpperCase('lowercase'); // 'LOWERCASE'
 *     toUpperCase('MixEd'); // 'MIXED'
 *     toUpperCase('UPPER'); // 'UPPER'
 */
export const toUpperCaseConfig: ColumnTransformConfig<string> = {
    type: TransformType.TRANSFORM,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            skipNulls: true,
            fn(input) {
                return input.toUpperCase();
            }
        };
    },
    description: 'Converts strings to upper case',
    argument_schema: {},
    accepts: [VectorType.String],
};
