import { toUpperCase } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Converts strings to upper case
 *
 * @example
 *
 *     toUpperCase('lowercase'); // 'LOWERCASE'
 *     toUpperCase('MixEd'); // 'MIXED'
 *     toUpperCase('UPPERCASE'); // 'UPPERCASE'
 */
export const toUpperCaseConfig: ColumnTransformConfig<string> = {
    type: TransformType.TRANSFORM,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: toUpperCase
        };
    },
    description: 'Converts strings to upper case',
    argument_schema: {},
    accepts: [VectorType.String],
};
