import { DateFormat, FieldType } from '@terascope/types';
import { formatDateValue, parseDateValue } from '../../core';
import { VectorType } from '../../vector';
import {
    ColumnTransformConfig, TransformMode, TransformType
} from '../interfaces';

export interface ToDateArgs {
    /**
     * When the value is a string, this indicates the date string format.
     * See https://date-fns.org/v2.16.1/docs/parse for more info
     *
     * Default: iso_8601 for strings and epoch_millis for number
    */
    format?: string|DateFormat;
}

/**
 * Converts date formatted values to a Date
 *
 * @todo we need to handle timezones?
 *
 * @example
 *
 *     toDate()
 *       // 1579034041034 => 1579034041034
 *       // '2020-01-14T20:34:01.034Z' => 1579034041034
 *
 *     toDate({ format: 'MMM do yy' })
 *       // 'Jan 14th 20' => 1579034041034
 *
 *     toDate({ format: 'M/d/yyyy' })
 *       // '1/14/2020' => 1579034041034
 *
 *     toDate({ format: 'seconds' })
 *       // 1579034041 => 1579034041034
 *
 *     toDate({ format: 'milliseconds' })
 *       // 1579034041034 => 1579034041034
 *
 */
export const toDateConfig: ColumnTransformConfig<any, string|number, ToDateArgs> = {
    type: TransformType.TRANSFORM,
    create(vector, { format }) {
        const referenceDate = new Date();

        return {
            mode: TransformMode.EACH_VALUE,
            output: { format },
            fn(value) {
                const parsed = parseDateValue(
                    value, format, referenceDate
                );
                return formatDateValue(parsed, format);
            }
        };
    },
    description: 'Converts the values to a date',
    argument_schema: {
        format: {
            type: FieldType.String,
            description: `When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: iso_8601 for strings and epoch_millis for number`
        }
    },
    accepts: [VectorType.String, VectorType.Int, VectorType.Float],
    output: {
        type: FieldType.Date
    }
};
