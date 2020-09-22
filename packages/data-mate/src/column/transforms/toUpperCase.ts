import { VectorIteratorMode, VectorType } from '../../vector';
import { ColumnTransformConfig } from '../interfaces';

/**
 * Converts strings to upper case
 *
 * @example
 *
 *     toUpperCase('lowercase'); // 'LOWERCASE';
 *     toUpperCase(['MixEd', null, 'lower']); // ['MIXED', 'LOWER'];
 */
export const toUpperCaseConfig: ColumnTransformConfig<string> = {
    create() {
        return {
            mode: VectorIteratorMode.EACH_VALUE,
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
