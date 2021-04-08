import { DateFormat, FieldType } from '@terascope/types';
import { formatDateValue, parseDateValue } from '../../core';
import { VectorType } from '../../vector';
import {
    ColumnTransformConfig, TransformMode, TransformType
} from '../interfaces';

export interface FormatDateArgs {
    /**
     * The date format, see https://date-fns.org/v2.16.1/docs/format for more info
    */
    format: string|DateFormat;
}

/**
 * Converts a date value to a formatted date string
 *
 * @todo we need to handle timezones?
 *
 * @example
 *
 *     formatDate({ format: 'MMM do yy' })
 *       // 1579034041034 => 'Jan 14th 20'
 *
 *     formatDate({ format: 'M/d/yyyy' })
 *       // 1579034041034 => '1/14/2020'
 *
 *     formatDate({ format: 'yyyy-MM-dd' })
 *       // 1579034041034 => '2020-01-14'
 */
export const formatDateConfig: ColumnTransformConfig<
string|number, string|number, FormatDateArgs
> = {
    type: TransformType.TRANSFORM,
    create(vector, args) {
        const { format } = args;

        const referenceDate = new Date();
        return {
            mode: TransformMode.EACH_VALUE,
            output: { format },
            fn(value) {
                const parsed = parseDateValue(
                    value, vector.config.format, referenceDate
                );
                return formatDateValue(parsed, format);
            }
        };
    },
    description: 'Converts a date value to a formatted date string',
    argument_schema: {
        format: {
            type: FieldType.String,
            description: 'The date format, see https://date-fns.org/v2.16.1/docs/format for more info.'
        }
    },
    required_args: ['format'],
    accepts: [VectorType.Date]
};
