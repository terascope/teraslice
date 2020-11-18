import { isString } from '@terascope/utils';
import validator from 'validator';
import { VectorType } from '../../vector';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

function isUUID(value: string): boolean {
    if (!isString(value)) return false;
    return validator.isUUID(value);
}

/**
 * Validates that the input is a UUID
 *
 * @example
 *     isUUID()
 *       // '0668CF8B-27F8-2F4D-4F2D-763AC7C8F68B' => true
 *       // 'BAD-UUID' => false
 *       // '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b' => true
 */
export const isUUIDConfig: ColumnValidateConfig<string> = {
    type: TransformType.VALIDATE,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: isUUID
        };
    },
    description: 'Validates that the input is a UUID',
    accepts: [VectorType.String],
    argument_schema: {},
};
