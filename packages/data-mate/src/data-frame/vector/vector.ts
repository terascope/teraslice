import { FieldType, Maybe } from '@terascope/types';

/**
 * The Vector Type, this will change how the data is stored and read
*/
export enum VectorType {
    /**
     * Currently this operates like String
     * but I imagine will be expanding it.
     * But will need to add format options
    */
    Date = 'Date',
    String = 'String',
    Int = 'Int',
    Float = 'Float',
    BigInt = 'BigInt',
    Boolean = 'Boolean',
    /** @todo */
    Geo = 'Geo',
    /** @todo */
    Object = 'Object',
    /**
     * Arbitrary data can be stored with this
    */
    Any = 'Any',
    /**
     * The list type is used for fields marked as Arrays
     * where each item in the Vector is a child element
    */
    List = 'List',
}

/**
 * Coerce a value so it can be stored in the vector
*/
export type ValueFromFn<T> = (value: unknown, thisArg?: Vector<T>) => Maybe<T>;
/**
 * Serialize a value to a JSON compatible format (so it can be JSON stringified)
*/
export type ValueToJSONFn<T> = (value: Maybe<T>, thisArg?: Vector<T>) => any;

/**
 * A list of Vector Options
 */
export interface VectorOptions<T> {
    fieldType: FieldType;
    values: Maybe<T>[];
    valueFrom?: ValueFromFn<T>;
    valueToJSON?: ValueToJSONFn<T>;
}

/**
 * A append-only typed Array class with a constrained API.
 *
 * @note null/undefined values are treated the same
*/
export abstract class Vector<T = unknown> {
    readonly type: VectorType;
    readonly fieldType: FieldType;
    readonly valueFrom?: ValueFromFn<T>;
    readonly valueToJSON?: ValueToJSONFn<T>;

    protected readonly _values: Maybe<T>[];

    static [Symbol.hasInstance](instance: unknown): boolean {
        return isVector(instance);
    }

    constructor(
        /**
         * This will be set automatically by specific Vector classes
         */
        type: VectorType,
        {
            values = [], fieldType, valueFrom, valueToJSON
        }: VectorOptions<T>
    ) {
        this.type = type;
        this.fieldType = fieldType;
        this.valueFrom = valueFrom;
        this.valueToJSON = valueToJSON;

        this._values = valueFrom
            ? values.map((value) => valueFrom(value, this))
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
        this._values[index] = this.valueFrom ? this.valueFrom(value, this) : value;
    }

    /**
     * Slice get select values from vector
    */
    slice(start: number, end?: number): Maybe<T>[] {
        return this._values.slice(start, end);
    }

    /**
     * Append a value to the end of the array
     *
     * **WARNING:**
     *     Use with caution, especially when this vector is used
     *     within the context of a DataFrame
    */
    append(value: Maybe<T>): number {
        return this._values.push(this.valueFrom ? this.valueFrom(value, this) : value);
    }

    /**
     * Convert the Vector an array of values (the output is JSON compatible)
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
