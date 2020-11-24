import { FieldType } from '@terascope/types';
import { truncateFP } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

type TruncateArgs = {
    size: number;
};

/**
 * Constrain a string to specific size
 *
 * @example
 *
 *      truncate(size: 8)
 *          // 'people are awesome' => 'people a'
 *      truncate(size: 20)
 *          // 'within the limit' => 'within the limit'
 */
export const truncateConfig: ColumnTransformConfig<string, string, TruncateArgs> = {
    type: TransformType.TRANSFORM,
    create(_vector, { size }) {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: truncateFP(size, false)
        };
    },
    description: 'Constrain a string to specific size',
    argument_schema: {
        size: {
            type: FieldType.Integer
        }
    },
    required_args: ['size'],
    accepts: [VectorType.String],
};
