import { BigMap } from '@terascope/utils';
import { Builder } from './Builder';

export abstract class BuilderWithCache<T = unknown> extends Builder<T> {
    _cache = new BigMap<any, T>()

    /**
     * Convert a value to the internal in-memory storage format for the Vector
    */
    abstract _valueFrom(value: unknown): T;

    /**
     * Convert a value to the internal in-memory storage format for the Vector
    */
    valueFrom(
        value: unknown,
        indices?: number|Iterable<number>,
    ): T {
        if (this._cache.has(value)) return this._cache.get(value)!;

        const result = super.valueFrom(value, indices);
        this._cache.set(value, result);
        return result;
    }
}
