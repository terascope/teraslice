import { FieldType } from '@terascope/types';
import { isEqualFP } from '@terascope/utils';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

export interface IsEqualArgs {
    value: any;
}

/**
 * Validates that an input equals matches a specific value
 *
 * @example
 *     isEqual(value: "example")
 *        // 'example' => true
 *        // 'other' => false
 *     isEqual(value: 13)
 *        // 13 => true
 *        // 20 => false
 *        // 13.5 => false
 */
export const isEqualConfig: ColumnValidateConfig<string, IsEqualArgs> = {
    type: TransformType.VALIDATE,
    create(_vector, args) {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: isEqualFP(args.value)
        };
    },
    description: 'Validates that an input equals matches a specific value',
    accepts: [],
    argument_schema: {
        value: {
            type: FieldType.Any
        }
    },
};
