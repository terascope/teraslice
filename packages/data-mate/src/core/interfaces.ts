export const MAX_8BIT_INT = (2 ** 8) - 1;
export const MAX_16BIT_INT = (2 ** 16) - 1;
export const MAX_32BIT_INT = (2 ** 32) - 1;

export type FieldArg<K extends (string|number|symbol)> = K[]|(readonly K[])|K;

export interface ReadonlySparseMap<V> extends Iterable<[number, V]> {
    // Members
    length: number;
    size: number;

    has(key: number): boolean;
    get(key: number): V | undefined;
    forEach(callback: (value: V, key: number, set: this) => void, scope?: any): void;
    keys(): IterableIterator<number>;
    values(): IterableIterator<V>;
    entries(): IterableIterator<[number, V]>;
    [Symbol.iterator](): IterableIterator<[number, V]>;
    inspect(): any;
}
