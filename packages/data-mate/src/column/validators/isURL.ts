import { isUri } from 'valid-url';
import { VectorType } from '../../vector';
import { ColumnValidateConfig, TransformMode, TransformType } from '../interfaces';

/**
 * Validates that the input is a url
 *
 * @example
 *     isURL()
 *       // 'https://someurl.cc.ru.ch => true
 *       // 'ftp://someurl.bom:8080?some=bar&hi=bob => true
 *       // 'http://xn--fsqu00a.xn--3lr804guic => true
 *       // 'http://example.com => true
 *       // 'BAD-URL => false
 */
export const isURLConfig: ColumnValidateConfig<string> = {
    type: TransformType.VALIDATE,
    create() {
        return {
            mode: TransformMode.EACH_VALUE,
            fn(value: string) {
                return isUri(value) != null;
            }
        };
    },
    description: 'Validates that the input is a url',
    accepts: [VectorType.String],
    argument_schema: {},
};
