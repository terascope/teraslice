import { FieldType, Maybe } from '@terascope/types';
import { CoerceFn } from './interfaces';

/**
 * A typed Array class (with a constrained API)
*/
export abstract class Vector<T = unknown> {
    readonly type: FieldType;
    protected readonly _values: Maybe<T>[];
    protected readonly coerce?: CoerceFn<T>;

    static [Symbol.hasInstance](instance: unknown): boolean {
        return isVector(instance);
    }

    constructor(
        fieldType: FieldType,
        values: Maybe<T>[] = [],
        coerce?: CoerceFn<T>
    ) {
        this.type = fieldType;
        this.coerce = coerce;

        this._values = coerce
            ? values.map(coerce)
            : values.slice();
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        for (const val of this._values) {
            yield val;
        }
    }

    /**
     * Returns the number items in the Vector
    */
    get length(): number {
        return this._values.length;
    }

    /**
     * Get value by index
    */
    get(index: number): Maybe<T> {
        return this._values[index];
    }

    /**
     * Set a value by index
    */
    set(index: number, value: Maybe<T>): void {
        this._values[index] = value;
    }

    /**
     * Append a value to the end of the array
    */
    append(value: Maybe<T>): number {
        return this._values.push(this.coerce ? this.coerce(value) : value);
    }

    /**
     * Convert the Vector an array of values
    */
    toArray(): Maybe<T>[] {
        return [...this];
    }
}

/**
 * Returns true if the input is a Vector
 */
export function isVector<T>(input: unknown): input is Vector<T> {
    if (input && typeof input === 'object') {
        if ('toArray' in input && 'append' in input) {
            return true;
        }
    }
    return false;
}
