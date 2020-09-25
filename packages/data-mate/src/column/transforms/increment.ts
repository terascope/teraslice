import { FieldType } from '@terascope/types';
import { toBigInt } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

export type IncrementArgs = {
    by?: number;
}

/**
 * Increment a numeric value
 *
 * @example
 *
 *     increment()
 *       // 1 => 2
 *       // 1.2 => 2.2
 *     increment({ by: -1 })
 *       // 1 => 0
 *       // 1.2 => 0.2
 *     increment({ by: 1.2 })
 *       // 1.2 => 2.4 (if a Float)
 *       // 1 => 2 (if a Integer it will round the value)
 */
export const incrementConfig: ColumnTransformConfig<any, any, IncrementArgs> = {
    type: TransformType.TRANSFORM,
    create(vector, args) {
        if (vector.type === VectorType.BigInt) {
            const by = toBigInt(args.by ?? 1);
            return {
                mode: TransformMode.EACH_VALUE,
                fn(value: bigint) {
                    return value + by;
                }
            };
        }

        const by = args.by ?? 1;
        return {
            mode: TransformMode.EACH_VALUE,
            fn(value: number) {
                return value + by;
            }
        };
    },
    description: 'Increment a numeric value',
    argument_schema: {
        by: {
            type: FieldType.Number,
            description: 'The value to increment the number by. Defaults to 1'
        }
    },
    accepts: [
        VectorType.BigInt, VectorType.Int, VectorType.Float,
    ],
};
