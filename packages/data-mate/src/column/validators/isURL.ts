import { isUri } from 'valid-url';
import { VectorIteratorMode, VectorType } from '../../vector';
import { ColumnValidateConfig } from '../interfaces';

/**
 * Validates that the input is a url
 *
 * @example
 *     isURL('https://someurl.cc.ru.ch'); // true
 *     isURL('ftp://someurl.bom:8080?some=bar&hi=bob'); // true
 *     isURL('http://xn--fsqu00a.xn--3lr804guic'); // true
 *     isURL('http://example.com'); // true
 *     isURL('BAD-URL'); // false
 */
export const isURLConfig: ColumnValidateConfig<string> = {
    create() {
        return {
            mode: VectorIteratorMode.EACH_VALUE,
            skipNulls: true,
            fn(value) {
                return isUri(value) != null;
            }
        };
    },
    description: 'Validates that the input is a url',
    accepts: [VectorType.String],
    argument_schema: {},
};
