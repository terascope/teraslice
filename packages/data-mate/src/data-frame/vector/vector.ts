import { FieldType, Maybe } from '@terascope/types';

export type ValueFromJSONFn<T> = (value: Maybe<T>|unknown, thisArg?: Vector<T>) => Maybe<T>;
export type ValueToJSONFn<T> = (value: Maybe<T>, thisArg?: Vector<T>) => any;

export interface VectorOptions<T> {
    type: FieldType,
    values: Maybe<T>[],
    valueFromJSON?: ValueFromJSONFn<T>,
    valueToJSON?: ValueToJSONFn<T>
}

/**
 * A typed Array class (with a constrained API)
*/
export abstract class Vector<T = unknown> {
    readonly type: FieldType;
    protected readonly _values: Maybe<T>[];
    readonly valueFromJSON?: ValueFromJSONFn<T>;
    readonly valueToJSON?: ValueToJSONFn<T>;

    static [Symbol.hasInstance](instance: unknown): boolean {
        return isVector(instance);
    }

    constructor({
        values = [], type, valueFromJSON, valueToJSON
    }: VectorOptions<T>) {
        this.type = type;
        this.valueFromJSON = valueFromJSON;
        this.valueToJSON = valueToJSON;

        this._values = valueFromJSON
            ? values.map((value) => valueFromJSON(value, this))
            : values.slice();
    }

    * [Symbol.iterator](): IterableIterator<Maybe<T>> {
        yield* this._values;
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
        return this._values.push(this.valueFromJSON ? this.valueFromJSON(value, this) : value);
    }

    /**
     * Convert the Vector an array of values
    */
    toJSON<V = T>(): Maybe<V>[] {
        if (!this.valueToJSON) {
            return [...this] as any[];
        }

        const res: Maybe<V>[] = [];
        for (const value of this) {
            res.push(this.valueToJSON(value, this));
        }
        return res;
    }
}

/**
 * Returns true if the input is a Vector
 */
export function isVector<T>(input: unknown): input is Vector<T> {
    if (input && typeof input === 'object') {
        if ('toJSON' in input && 'append' in input) {
            return true;
        }
    }
    return false;
}
