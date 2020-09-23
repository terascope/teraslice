import { toLowerCase } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Converts strings to lower case
 *
 * @example
 *
 *     toLowerCase('lowercase'); // 'LOWERCASE'
 *     toLowerCase('MixEd'); // 'MIXED'
 *     toLowerCase('UPPERCASE'); // 'UPPERCASE'
 */
export const toLowerCaseConfig: ColumnTransformConfig<string> = {
    type: TransformType.TRANSFORM,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: toLowerCase
        };
    },
    description: 'Converts strings to lower case',
    argument_schema: {},
    accepts: [VectorType.String],
};
