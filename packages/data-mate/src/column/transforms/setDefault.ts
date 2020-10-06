import { FieldType } from '@terascope/types';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

type SetDefaultArgs = {
    value: any;
};

/**
 * Replace missing values in a column with a constant value
 *
 * @example
 *
 *     setDefault(value: 'default')
 *       // null => 'default'
 *       // 'existing' => 'existing'
 *       // ['value', null] => ['value', 'default' ]
 *       // null (array value) => ['default']
 *     setDefault(value: 1)
 *       // null => 1
 *       // 12 => 12
 *       // [2, null] => [2, 1]
 *       // null (array value) => [1]
 */
export const setDefaultConfig: ColumnTransformConfig<any, any, SetDefaultArgs> = {
    type: TransformType.TRANSFORM,
    create(vector, args) {
        const isList = vector.type === VectorType.List;
        return {
            mode: TransformMode.EACH,
            fn(value) {
                if (isList) {
                    if (value == null) return [args.value];
                    const result = [];
                    for (const val of value) {
                        result.push(val != null ? val : args.value);
                    }
                    return result;
                }
                return value != null ? value : args.value;
            }
        };
    },
    description: 'Replace missing values in a column with a constant value',
    argument_schema: {
        value: {
            type: FieldType.Any,
            description: 'The default value to use'
        }
    },
    accepts: [],
    required_args: ['value'],
};
