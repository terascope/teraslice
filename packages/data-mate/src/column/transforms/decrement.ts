import { FieldType } from '@terascope/types';
import { toBigIntOrThrow } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

export type DecrementArgs = {
    by?: number;
}

/**
 * Decrement a numeric value
 *
 * @example
 *
 *     decrement()
 *       // 1 => 0
 *       // 1.2 => 0.2
 *     decrement({ by: -1 })
 *       // 1 => 2
 *       // 1.2 => 2.2
 *     decrement({ by: 1.1 })
 *       // 1.1 => 0 (if a Float)
 *       // 1.1 => 0 (if a Integer it will round the value)
 */
export const decrementConfig: ColumnTransformConfig<any, any, DecrementArgs> = {
    type: TransformType.TRANSFORM,
    create(vector, args) {
        if (vector.type === VectorType.BigInt) {
            const by = toBigIntOrThrow(args.by ?? 1);
            return {
                mode: TransformMode.EACH_VALUE,
                fn(value: bigint) {
                    return value - by;
                }
            };
        }

        const by = args.by ?? 1;
        return {
            mode: TransformMode.EACH_VALUE,
            fn(value: number) {
                return value - by;
            }
        };
    },
    description: 'Decrement a numeric value',
    argument_schema: {
        by: {
            type: FieldType.Number,
            description: 'The value to decrement the number by. Defaults to 1'
        }
    },
    accepts: [
        VectorType.BigInt, VectorType.Int, VectorType.Float,
    ],
};
