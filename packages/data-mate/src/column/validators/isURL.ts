import { isString } from '@terascope/utils';
import { isUri } from 'valid-url';
import { VectorType } from '../../vector';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

function isURL(value: string): boolean {
    if (!isString(value)) return false;
    return isUri(value) != null;
}

/**
 * Validates that the input is a URL
 *
 * @example
 *     isURL()
 *       // 'https://someurl.cc.ru.ch' => true
 *       // 'ftp://someurl.bom:8080?some=bar&hi=bob' => true
 *       // 'http://xn--fsqu00a.xn--3lr804guic' => true
 *       // 'http://example.com' => true
 *       // 'BAD-URL' => false
 */
export const isURLConfig: ColumnValidateConfig<string> = {
    type: TransformType.VALIDATE,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn: isURL
        };
    },
    description: 'Validates that the input is a URL',
    accepts: [VectorType.String],
    argument_schema: {},
};
