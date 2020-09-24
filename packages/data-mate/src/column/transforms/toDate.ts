import { DateFormat, FieldType } from '@terascope/types';
import { isValidDateInstance, toInteger } from '@terascope/utils';
import parseDate from 'date-fns/parse';
import parseJSONDate from 'date-fns/parseJSON';
import { DateValue, VectorType } from '../../vector';
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

const systemTimezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

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

            return {
                mode: TransformMode.EACH_VALUE,
                output: { format },
                fn(value: string): DateValue {
                    const date = parseDate(value, format, Date.now());
                    if (!isValidDateInstance(date)) {
                        throw new Error(`Expected value ${value} to be a date string with format ${format}`);
                    }

                    const epochMillis = date.getTime() - systemTimezoneOffset;
                    return new DateValue(epochMillis, value);
                }
            };
        }

        if (format === DateFormat.epoch) {
            return {
                mode: TransformMode.EACH_VALUE,
                output: { format },
                fn(value: number|string): DateValue {
                    const epoch = toInteger(value);
                    if (epoch === false || epoch < 0) {
                        throw new Error(`Expected value ${value} to be a valid time`);
                    }

                    const epochMillis = Math.floor(epoch * 1000);
                    if (epochMillis < 0 || !Number.isSafeInteger(epochMillis)) {
                        throw new Error(`Expected value ${value} to be a valid time`);
                    }

                    return new DateValue(epochMillis, epoch);
                }
            };
        }

        const defaultFormat = vector.type === VectorType.String
            ? DateFormat.iso_8601
            : DateFormat.epoch_millis;

        return {
            mode: TransformMode.EACH_VALUE,
            output: { format: defaultFormat },
            fn(value: string|number): DateValue {
                const date = parseJSONDate(value);
                if (!isValidDateInstance(date)) {
                    throw new Error(`Expected value ${value} to be a valid date`);
                }

                return new DateValue(date.getTime(), value);
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
