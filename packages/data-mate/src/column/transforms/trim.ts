import { FieldType } from '@terascope/types';
import { trim } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

type TrimArgs = {
    char?: string;
};

/**
 * Trim whitespace, or specific character, from the beginning and end of a string
 *
 * @example
 *
 *      trim()
 *          // '     left' => 'left'
 *          // 'right    ' => 'right'
 *          // '  center ' => 'center'
 *          // '         ' => ''
 *      trim(char: 'fast')
 *          // 'fast cars race fast' => ' cars race '
 *      trim(char: '.*')
 *          // '.*.*a regex test.*.*.*.*' => 'a regex test'
 *      trim(char: '\r')
 *          // '\t\r\rexample\r\r' => 'example'
 */
export const trimConfig: ColumnTransformConfig<string, string, TrimArgs> = {
    type: TransformType.TRANSFORM,
    create(_vector) {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: trim
        };
    },
    description: 'Trim whitespace, or specific character, from the beginning and end of a string',
    argument_schema: {
        char: {
            type: FieldType.String,
            description: 'The character to trim'
        }
    },
    accepts: [VectorType.String],
};
