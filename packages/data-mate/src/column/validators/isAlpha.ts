import { isString } from '@terascope/utils';
import validator from 'validator';
import { VectorType } from '../../vector';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

function isAlpha(value: string): boolean {
    if (!isString(value)) return false;
    return validator.isAlpha(value);
}

/**
 * Validates that the input contains only a-zA-Z characters
 *
 * @example
 *     isAlpha()
 *       // 'Example' => true
 *       // 'example123' => false
 *       // 'foo bar' => false
 *       // 'ha3ke5@' => false
 *       // 'example.com' => false
 */
export const isAlphaConfig: ColumnValidateConfig<string> = {
    type: TransformType.VALIDATE,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: isAlpha
        };
    },
    description: 'Validates that the input contains only a-zA-Z characters',
    accepts: [VectorType.String],
    argument_schema: {},
};
