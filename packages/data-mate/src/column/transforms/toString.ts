import { DateFormat, FieldType } from '@terascope/types';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Converts value to a string
 *
 * @example
 *
 *     toString()
 *       // 1 => '1'
 *       // 0.01 => '0.01'
 *       // true => 'true'
 *       // BigInt(2) ** BigInt(64) => '18,446,744,073,709,551,616'
 *       // new Date('2020-09-23T14:54:21.020Z') => '2020-09-23T14:54:21.020Z'
 */
export const toStringConfig: ColumnTransformConfig<any, string> = {
    type: TransformType.TRANSFORM,
    create(vector) {
        if (vector.type === VectorType.Date) {
            return {
                mode: TransformMode.EACH_VALUE,
                fn(value) {
                    if (typeof value === 'string') return value;
                    if (vector.config.format === DateFormat.epoch
                        || vector.config.format === DateFormat.seconds) {
                        return new Date(Math.floor(value * 1000)).toISOString();
                    }
                    return new Date(value).toISOString();
                }
            };
        }

        return {
            mode: TransformMode.NONE,
        };
    },
    description: 'Converts value to a string',
    argument_schema: {},
    accepts: [
        VectorType.BigInt, VectorType.Int, VectorType.Float,
        VectorType.Boolean, VectorType.Date
    ],
    output: {
        type: FieldType.String
    }
};
