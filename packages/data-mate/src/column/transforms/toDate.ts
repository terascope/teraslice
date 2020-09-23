import { FieldType } from '@terascope/types';
import { getValidDate, isValidDateInstance, toInteger } from '@terascope/utils';
import parseDate from 'date-fns/parse';
import parseISODate from 'date-fns/parseISO';
import { VectorType } from '../../vector';
import {
    ColumnTransformConfig, TransformMode, TransformType
} from '../interfaces';

export interface ToDateArgs {
    /**
     * When the value is a string, this indicates the date string format.
     * See https://date-fns.org/v2.16.1/docs/parse for more info
     *
     * @default 'ISO 8061' formatted string
    */
    format?: string;

    /**
     * When the value is a number, this will indicate whether the value
     * is in milliseconds or seconds
     *
     * @default 'milliseconds'
    */
    resolution?: 'seconds'|'milliseconds';
}

/**
 * Converts date formatted values to a Date
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
 *     toDate({ resolution: 'seconds' })
 *       // 1579034041 => 1579034041034
 *
 *     toDate({ resolution: 'milliseconds' })
 *       // 1579034041034 => 1579034041034
 *
 */
export const toDateConfig: ColumnTransformConfig<any, number, ToDateArgs> = {
    type: TransformType.TRANSFORM,
    create(vector, args) {
        const { format, resolution } = args;
        if (format) {
            if (vector.type !== VectorType.String && vector.type !== VectorType.Any) {
                throw new Error(
                    'Expected string values when using toDate({ format })'
                );
            }

            const referenceDate = new Date();
            return {
                mode: TransformMode.EACH_VALUE,
                fn(value: string): number {
                    const date = parseDate(value, format, referenceDate);
                    if (!isValidDateInstance(date)) {
                        throw new Error(`Expected value ${value} to be a date string with format ${format}`);
                    }
                    return date.getTime();
                }
            };
        }

        if (resolution === 'seconds') {
            return {
                mode: TransformMode.EACH_VALUE,
                fn(value: number|string): number {
                    const int = toInteger(value);
                    if (int === false || int < 0) {
                        throw new Error(`Expected value ${value} to be a valid time`);
                    }
                    return Math.round(int * 1000);
                }
            };
        }

        if (vector.type === VectorType.String) {
            return {
                mode: TransformMode.EACH_VALUE,
                fn(value: string): number {
                    const date = parseISODate(value);
                    if (!isValidDateInstance(date)) {
                        throw new Error(`Expected value ${value} to be a valid ISO 8601 date`);
                    }
                    return date.getTime();
                }
            };
        }

        return {
            mode: TransformMode.EACH_VALUE,
            fn(value: string|number): number {
                const date = getValidDate(value);
                if (date === false) {
                    throw new Error(`Expected value ${value} to be a valid date`);
                }
                return date.getTime();
            }
        };
    },
    description: 'Converts the values to a date',
    argument_schema: {
        format: {
            type: FieldType.String,
            description: `When the value is a string, this indicates the date string format.
See https://date-fns.org/v2.16.1/docs/parse for more info.
Default: ISO 8601 formatted string`
        },
        resolution: {
            type: FieldType.String,
            description: `When the value is a number, this will indicate whether the value is in milliseconds or seconds.
Default: 'milliseconds'`
        }
    },
    accepts: [VectorType.String, VectorType.Int, VectorType.Float, VectorType.Any],
    output: {
        type: FieldType.Date
    }
};
