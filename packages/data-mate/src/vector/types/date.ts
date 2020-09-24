/* eslint-disable max-classes-per-file */
import { Vector, VectorOptions } from '../vector';
import { VectorType } from '../interfaces';

/**
 * The internal date storage format
*/
export class DateValue {
    /**
     * The original formatted date
    */
    readonly formatted: string|number|undefined;

    /**
     * Date stored in epoch milliseconds
    */
    readonly value: number;

    constructor(epochMillis: number, formatted?: string|number) {
        this.value = epochMillis;
        if (epochMillis === formatted || !formatted) {
            this.formatted = undefined;
        } else {
            this.formatted = formatted;
        }
    }

    [Symbol.toPrimitive](hint: 'string'|'number'|'default'): any {
        if (hint === 'number') return this.value;
        return `${this.formatted ?? this.value}`;
    }
}

export class DateVector extends Vector<DateValue> {
    static valueToJSON({ value, formatted }: DateValue): string|number {
        return formatted ?? value;
    }

    constructor(options: VectorOptions<DateValue>) {
        super(VectorType.Date, {
            valueToJSON: DateVector.valueToJSON,
            ...options,
        });
    }

    fork(data = this.data): DateVector {
        return new DateVector({
            valueToJSON: this.valueToJSON,
            config: this.config,
            data,
        });
    }
}
