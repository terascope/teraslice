import { DataTypeFieldConfig, Maybe } from '@terascope/types';
import { newVector, Vector, VectorType } from '../vector';

/**
 * Coerce a value so it can be stored in the builder
*/
export type ValueFromFn<T> = (value: unknown, thisArg?: Builder<T>) => Maybe<T>;

/**
 * A list of Builder Options
 */
export interface BuilderOptions<T> {
    config: DataTypeFieldConfig;
    valueFrom?: ValueFromFn<T>;
}

/**
 * A Vector builder
*/
export abstract class Builder<T = unknown> {
    readonly type: VectorType;
    readonly config: DataTypeFieldConfig;
    readonly valueFrom?: ValueFromFn<T>;

    protected readonly _values: Maybe<T>[] = [];

    constructor(
        /**
         * This will be set automatically by specific Builder classes
         */
        type: VectorType,
        { config, valueFrom }: BuilderOptions<T>
    ) {
        this.type = type;
        this.config = config;
        this.valueFrom = valueFrom;
    }

    /**
     * Returns the number items in the Builder
    */
    get size(): number {
        return this._values.length;
    }

    /**
     * Set value by index
    */
    set(index: number, value: unknown): Builder<T> {
        this._values[index] = ((
            this.valueFrom ? this.valueFrom(value, this) : value
        ) ?? null) as Maybe<T>;
        return this;
    }

    /** Append a value to the end */
    append(value: unknown): Builder<T> {
        return this.set(this._values.length, value);
    }

    /**
     * Flush and convert the result to a Vector
    */
    toVector(): Vector<T> {
        return newVector(this.config, Object.freeze({
            values: Object.freeze(this._values)
        }));
    }
}

/**
 * Returns true if the input is a Builder
 */
export function isBuilder<T>(input: unknown): input is Builder<T> {
    return input instanceof Builder;
}
