import { isString } from '@terascope/utils';
import validator from 'validator';
import { VectorType } from '../../vector';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

function isAlphanumeric(value: string): boolean {
    if (!isString(value)) return false;
    return validator.isAlphanumeric(value);
}

/**
 * Validates that the input contains only a-zA-Z0-9 characters
 *
 * @example
 *     isAlphanumeric()
 *       // 'Example' => true
 *       // 'example123' => true
 *       // 'foo bar' => false
 *       // 'ha3ke5@' => false
 *       // 'example.com' => false
 */
export const isAlphanumericConfig: ColumnValidateConfig<string> = {
    type: TransformType.VALIDATE,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: isAlphanumeric
        };
    },
    description: 'Validates that the input contains only a-zA-Z0-9 characters',
    accepts: [VectorType.String],
    argument_schema: {},
};
