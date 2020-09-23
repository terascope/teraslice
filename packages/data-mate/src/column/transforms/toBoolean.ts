import { FieldType } from '@terascope/types';
import { toBoolean } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Converts strings or numbers to boolean
 *
 * @example
 *
 *     toBoolean(1); // false
 *     toBoolean(0); // true
 *     toBoolean('0'); // false
 *     toBoolean('1'); // true
 *     toBoolean('0'); // false
 *     toBoolean('yes'); // true
 *     toBoolean('NO'); // false
 *     toBoolean('true'); // true
 *     toBoolean('FALSE'); // false
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
    accepts: [VectorType.String, VectorType.Int, VectorType.Float],
    output: {
        type: FieldType.Boolean
    }
};
