import { FieldType } from '@terascope/types';
import { toBoolean } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Converts strings or numbers to boolean
 *
 * @example
 *
 *     toBoolean()
 *       // 0 => false
 *       // 1 => true
 *       // '0' => false
 *       // '1' => true
 *       // 'yes' => true
 *       // 'NO' => false
 *       // 'true' => true
 *       // 'FALSE' => false
 */
export const toBooleanConfig: ColumnTransformConfig<any, boolean> = {
    type: TransformType.TRANSFORM,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: toBoolean
        };
    },
    description: 'Converts strings to upper case',
    argument_schema: {},
    accepts: [VectorType.String, VectorType.Int, VectorType.Float, VectorType.Any],
    output: {
        type: FieldType.Boolean
    }
};
