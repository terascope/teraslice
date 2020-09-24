import { DateFormat, FieldType } from '@terascope/types';
import formatDate from 'date-fns/format';
import { DateValue, VectorType } from '../../vector';
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
export const formatDateConfig: ColumnTransformConfig<DateValue, DateValue, FormatDateArgs> = {
    type: TransformType.TRANSFORM,
    create(_vector, args) {
        const { format } = args;

        return {
            mode: TransformMode.EACH_VALUE,
            output: { format },
            fn(value: DateValue): DateValue {
                const formatted = formatDate(value.value, format);
                return new DateValue(value.value, formatted);
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
