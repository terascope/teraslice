import { FieldType } from '@terascope/types';
import { trimStart } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

type TrimStartArgs = {
    char?: string;
};

/**
 * Trim whitespace, or specific character, from the beginning of a string
 *
 * @example
 *
 *      trimStart()
 *          // '     left' => 'left'
 *          // 'right    ' => 'right    '
 *          // '  center ' => 'center '
 *          // '         ' => ''
 *      trimStart(char: 'fast')
 *          // 'fast cars race fast' => ' cars race fast'
 *      trimStart(char: '.*')
 *          // '.*.*a regex test.*.*.*.*' => '.*.*a regex test'
 *      trimStart(char: '\r')
 *          // '\t\r\rexample\r\r' => 'example\r\r'
 */
export const trimStartConfig: ColumnTransformConfig<string, string, TrimStartArgs> = {
    type: TransformType.TRANSFORM,
    create(_vector) {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: trimStart
        };
    },
    description: 'Trim whitespace, or specific character, from the beginning of a string',
    argument_schema: {
        char: {
            type: FieldType.String,
            description: 'The character to trim'
        }
    },
    accepts: [VectorType.String],
};
