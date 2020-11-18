import { isEmail } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Validates that the input is a email
 *
 * @example
 *     isEmail()
 *       // 'ha3ke5@pawnage.com' => true
 *       // 'user@blah.com/junk.junk?a=<tag value="junk"' => true
 *       // 'email@example.com' => true
 *       // 'email @ example.com' => false
 *       // 'example.com' => false
 */
export const isEmailConfig: ColumnValidateConfig<string> = {
    type: TransformType.VALIDATE,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: isEmail
        };
    },
    description: 'Validates that the input is a Email',
    accepts: [VectorType.String],
    argument_schema: {},
};
