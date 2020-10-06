import { FieldType } from '@terascope/types';
import { trimEnd } from '@terascope/utils';
import { VectorType } from '../../vector';
import { ColumnTransformConfig, TransformMode, TransformType } from '../interfaces';

type TrimEndArgs = {
    char?: string;
};

/**
 * Trim whitespace, or specific character, from the end of a string
 *
 * @example
 *
 *      trimEnd()
 *          // '     left' => '     left'
 *          // 'right    ' => 'right'
 *          // '  center ' => '  center'
 *          // '         ' => ''
 *      trimEnd(char: 'fast')
 *          // 'fast cars race fast' => 'fast cars race '
 *      trimEnd(char: '.*')
 *          // '.*.*a regex test.*.*.*.*' => 'a regex test.*.*.*.*'
 *      trimEnd(char: '\r')
 *          // '\t\r\rexample\r\r' => '\t\r\rexample'
 */
export const trimEndConfig: ColumnTransformConfig<string, string, TrimEndArgs> = {
    type: TransformType.TRANSFORM,
    create(_vector, { char }) {
        return {
            mode: TransformMode.EACH_VALUE,
            fn(value: string) {
                return trimEnd(value, char);
            }
        };
    },
    description: 'Trim whitespace, or specific character, from end of a string',
    argument_schema: {
        char: {
            type: FieldType.String,
            description: 'The character to trim'
        }
    },
    accepts: [VectorType.String],
};
