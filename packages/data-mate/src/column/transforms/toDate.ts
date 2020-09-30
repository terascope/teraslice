import { DateFormat, FieldType } from '@terascope/types';
import { DateValue } from '../../core-utils';
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
 *       // ''Jan 14th 20' => 1579034041034
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
export const toDateConfig: ColumnTransformConfig<any, DateValue, ToDateArgs> = {
    type: TransformType.TRANSFORM,
    create(vector, args) {
        const { format } = args;
        if (format && !(format in DateFormat)) {
            if (vector.type !== VectorType.String && vector.type !== VectorType.Any) {
                throw new Error(
                    'Expected string values when using toDate({ format })'
                );
            }

            const referenceDate = new Date();
            return {
                mode: TransformMode.EACH_VALUE,
                output: { format },
                fn(value: string): DateValue {
                    return DateValue.fromValueToFormat(
                        value, format, referenceDate
                    );
                }
            };
        }

        if (format === DateFormat.epoch) {
            return {
                mode: TransformMode.EACH_VALUE,
                output: { format },
                fn: DateValue.fromValueToEpoch
            };
        }

        const defaultFormat = vector.type === VectorType.String
            ? DateFormat.iso_8601
            : DateFormat.epoch_millis;

        return {
            mode: TransformMode.EACH_VALUE,
            output: { format: defaultFormat },
            fn(value: string|number): DateValue {
                return DateValue.fromValue(
                    value,
                    defaultFormat
                );
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
