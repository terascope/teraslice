import { LRUMap } from 'mnemonist';
import { ValueFromFn } from '../Builder';

export function makeCachedValueFrom<T>(valueFrom: ValueFromFn<T>): ValueFromFn<T> {
    const cache = new LRUMap<unknown, T>(10000);
    return function _cachedValueFrom(value, thisArg) {
        const cached = cache.get(value);
        if (cached) return cached;

        const transformed = valueFrom(value, thisArg);
        cache.set(value, transformed);
        return transformed;
    };
}
