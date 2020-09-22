import * as ts from '@terascope/utils';
import { VectorIteratorMode } from '../../vector';
import { ColumnValidateConfig } from '../interfaces';

/**
 * Validates that the input is a boolean
 *
 * @example
 *
 *     isBoolean(false); // true
 *     isBoolean('astring'); // false
 *     isBoolean(0); // false
 */
export const isBooleanConfig: ColumnValidateConfig<unknown> = {
    create() {
        return {
            mode: VectorIteratorMode.EACH_VALUE,
            skipNulls: true,
            fn: ts.isBoolean
        };
    },
    description: 'Validates that the input is a boolean',
    accepts: [],
    argument_schema: {},
};
