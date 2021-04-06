import parseDate from 'date-fns/parse';
import { DateFormat } from '@terascope/types';
import { isValidDateInstance, makeISODate } from '@terascope/utils';
import { Vector, VectorOptions } from '../Vector';
import { VectorType, DataBuckets } from '../interfaces';

export class DateVector extends Vector<string|number> {
    referenceDate = new Date();
    getComparableValue = undefined;
    valueToJSON = undefined;

    constructor(data: DataBuckets<string|number>, options: VectorOptions) {
        super(VectorType.Date, data, options);
    }

    /**
     * Get the ISO 8061 date string from a value
    */
    valueToISOString(value: string|number): string {
        if (this.config.format === DateFormat.epoch_millis
            || this.config.format === DateFormat.milliseconds) {
            return new Date(value).toISOString();
        }

        if (this.config.format === DateFormat.epoch
            || this.config.format === DateFormat.seconds) {
            const ms = Math.floor((value as number) * 1000);
            return new Date(ms).toISOString();
        }

        if (this.config.format && this.config.format !== DateFormat.iso_8601) {
            const date = parseDate(value as string, this.config.format, this.referenceDate);
            if (!isValidDateInstance(date)) {
                throw new Error(`Expected value ${value} to be a date string with format ${this.config.format}`);
            }

            return date.toISOString();
        }

        return makeISODate(value);
    }
}
