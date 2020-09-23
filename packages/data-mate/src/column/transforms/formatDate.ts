import { FieldType } from '@terascope/types';
import { getValidDate } from '@terascope/utils';
import formatDate from 'date-fns/format';
import { DateValue, VectorType } from '../../vector';
import {
    ColumnTransformConfig, TransformMode, TransformType
} from '../interfaces';

export interface FormatDateArgs {
    /**
     * The date format, see https://date-fns.org/v2.16.1/docs/format for more info
     *
     * @default 'ISO 8061' formatted string
    */
    format?: string;
}

/**
 * Converts a date value to a formatted date string
 *
 * @example
 *
 *     formatDate()
 *       // 1579034041034 => '2020-01-14T20:34:01.034Z'
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
export const formatDateConfig: ColumnTransformConfig<DateValue, string, FormatDateArgs> = {
    type: TransformType.TRANSFORM,
    create(_vector, args) {
        const { format } = args;
        if (format) {
            return {
                mode: TransformMode.EACH_VALUE,
                fn(value: DateValue) {
                    return formatDate(value, format);
                }
            };
        }
        return {
            mode: TransformMode.EACH_VALUE,
            fn(value: DateValue) {
                const date = getValidDate(value);
                if (date === false) {
                    throw new Error(`Expected value ${value} to be a valid date`);
                }
                return date.toISOString();
            }
        };
    },
    description: 'Converts a date value to a formatted date string',
    argument_schema: {
        format: {
            type: FieldType.String,
            description: `The date format, see https://date-fns.org/v2.16.1/docs/format for more info.
 Default: ISO 8061 format`
        }
    },
    accepts: [VectorType.Date],
    output: {
        type: FieldType.Keyword
    }
};
