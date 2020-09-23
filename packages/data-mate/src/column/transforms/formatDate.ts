import { FieldType } from '@terascope/types';
import formatDate from 'date-fns/format';
import { DateValue, VectorType } from '../../vector';
import {
    ColumnTransformConfig, TransformMode, TransformType
} from '../interfaces';

export interface FormatDateArgs {
    format: string;
}

/**
 * Formats a date string, only works with date columns
 *
 * @example
 *
 *     formatDate({ format: 'MMM do yy' })
 *       // '2020-01-14T20:34:01.034Z' => 'Jan 14th 20'
 *
 *     formatDate({ format: 'M/d/yyyy' })
 *       // 'March 3, 2019' => '3/3/2019';
 *
 *     formatDate({ format: 'yyyy-MM-dd' })
 *       // 1581013130 => '2020-02-06';
 */
export const formatDateConfig: ColumnTransformConfig<DateValue, string, FormatDateArgs> = {
    type: TransformType.TRANSFORM,
    create(_vector, args) {
        return {
            mode: TransformMode.EACH_VALUE,
            fn(value: DateValue) {
                return formatDate(value, args.format);
            }
        };
    },
    description: 'Formats a date string',
    argument_schema: {},
    accepts: [VectorType.Date],
    output: {
        type: FieldType.Keyword
    }
};
