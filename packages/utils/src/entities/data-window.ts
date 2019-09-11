import { getValidDate, getUnixTime } from '../dates';
import { DataEntity } from './data-entity';
import { getTypeOf } from '../utils';
import * as i from './interfaces';
import * as utils from './utils';
import { locked } from '../misc';
import * as e from './entity';

/**
 * Acts as an collection of DataEntities associated to a particular key or time frame.
 * A `DataWindow` should be able to be used in-place of an `Array` in most cases.
 */
export class DataWindow<
    T = DataEntity,
    M = {}
> extends Array<T> implements e.Entity<T, M & e.EntityMetadata> {
    /**
     * A utility for safely creating a `DataWindow`
     */
    static make<T = DataEntity, M = {}>(
        input: T|T[], metadata?: M
    ): DataWindow<T, M> {
        if (DataWindow.is<T, M>(input)) {
            return input;
        }
        return new DataWindow(input, metadata);
    }

    /**
     * Verify that an input is a `DataWindow`
     */
    static is<T, M>(input: any): input is DataWindow<T, M> {
        return input instanceof DataWindow;
    }

    /**
     * Verify that an input is an Array of DataWindows
     */
    static isArray<T = DataEntity, M = {}>(
        input: any
    ): input is DataWindow<T, M>[] {
        if (input == null) return false;
        if (!Array.isArray(input)) return false;
        if (DataWindow.is(input)) return false;
        if (input.length === 0) return true;
        return input.every(DataWindow.is);
    }

    static [Symbol.hasInstance](instance: any): boolean {
        return utils.isDataWindow(instance);
    }

    private readonly [e.__ENTITY_METADATA_KEY]: {
        metadata: i.DataWindowMetadata & M;
    };
    private readonly [i.__IS_WINDOW_KEY]: true;

    constructor(docs?: T|T[], metadata?: M) {
        if (docs != null && utils.canConvertToEntityArray(docs)) {
            const entities: T[] = DataEntity.makeArray(docs) as any;
            super(...entities);
        } else {
            super();
        }
        utils.defineWindowProperties(this, metadata);
    }

    /**
     * Get the metadata for the `DataWindow`.
     *
     * If a field is specified, it will get that property of the metadata
    */
    getMetadata(key?: undefined): i.DataWindowMetadata & M;
    getMetadata<K extends keyof i.DataWindowMetadata>(key: K): i.DataWindowMetadata[K];
    getMetadata<K extends keyof M>(key: K): M[K];
    getMetadata(key: string|number): any;

    @locked()
    getMetadata<K extends keyof M|keyof i.DataWindowMetadata>(
        key?: K
    ): (i.DataWindowMetadata & M)[K]|(i.DataWindowMetadata & M) {
        if (key) {
            return this[e.__ENTITY_METADATA_KEY].metadata[key];
        }
        return this[e.__ENTITY_METADATA_KEY].metadata;
    }

    /**
     * Given a field and value set the metadata on the window
    */
    setMetadata<K extends string|number>(
        field: K,
        value: any
    ): void;
    setMetadata<K extends keyof i.DataWindowMetadata, V extends i.DataWindowMetadata[K]>(
        field: K,
        value: V
    ): void;
    setMetadata<K extends keyof M, V extends M[K]>(
        field: K,
        value: V
    ): void;

    @locked()
    setMetadata<K extends keyof M|keyof i.DataWindowMetadata>(field: K, value: any): void {
        if (field == null || field === '') {
            throw new Error('Missing field to set in metadata');
        }
        if (field === '_createTime') {
            throw new Error(`Cannot set readonly metadata property ${field}`);
        }
        if (field === '_key') {
            return this.setKey(value as any);
        }

        this[e.__ENTITY_METADATA_KEY].metadata[field] = value as any;
    }

    /**
     * Get the unique `_key` for the window
     *
     * If no `_key` is found, an error will be thrown
    */
    @locked()
    getKey(): string|number {
        const key = this[e.__ENTITY_METADATA_KEY].metadata._key;
        if (!utils.isValidKey(key)) {
            throw new Error('No key has been set in the metadata');
        }
        return key;
    }

    /**
     * Set the unique `_key` for the window
     *
     * If no `_key` is found, an error will be thrown
    */
    @locked()
    setKey(key: string|number): void {
        if (!utils.isValidKey(key)) {
            throw new Error('Invalid key to set in metadata');
        }
        this[e.__ENTITY_METADATA_KEY].metadata._key = key;
    }

    /**
     * Get the time at which this window was created.
    */
    @locked()
    getCreateTime(): Date {
        const val = this[e.__ENTITY_METADATA_KEY].metadata._createTime;
        const date = getValidDate(val);
        if (date === false) {
            throw new Error('Missing _createTime');
        }
        return date;
    }

    /**
     * Get the window start time
     *
     * If none is found, `undefined` will be returned.
     * If an invalid date is found, `false` will be returned.
    */
    @locked()
    getStartTime(): Date|false|undefined {
        const val = this[e.__ENTITY_METADATA_KEY].metadata._startTime;
        if (val == null) return undefined;
        return getValidDate(val);
    }

    /**
     * Set the window start time
     *
     * If the value is empty it will set the time to now.
     * If an invalid date is given, an error will be thrown.
     */
    @locked()
    setStartTime(val?: string|number|Date): void {
        const unixTime = getUnixTime(val);
        if (unixTime === false) {
            throw new Error(`Invalid date format, got ${getTypeOf(val)}`);
        }
        this[e.__ENTITY_METADATA_KEY].metadata._startTime = unixTime;
    }

    /**
     * Get the window completion time
     *
     * If none is found, `undefined` will be returned.
     * If an invalid date is found, `false` will be returned.
    */
    @locked()
    getFinishTime(): Date|false|undefined {
        const val = this[e.__ENTITY_METADATA_KEY].metadata._finishTime;
        if (val == null) return undefined;
        return getValidDate(val);
    }

    /**
     * Set the window completion time
     *
     * If the value is empty it will set the time to now.
     * If an invalid date is given, an error will be thrown.
     */
    @locked()
    setFinishTime(val?: string|number|Date): void {
        const unixTime = getUnixTime(val);
        if (unixTime === false) {
            throw new Error(`Invalid date format, got ${getTypeOf(val)}`);
        }
        this[e.__ENTITY_METADATA_KEY].metadata._finishTime = unixTime;
    }

    // override behaviour of an Array...

    push(...items: T[]) {
        if (!DataEntity.isArray(items)) {
            throw new Error('Invalid item added to DataWindow, expected DataEntity');
        }
        return super.push(...items as any);
    }

    unshift(...items: T[]) {
        if (!DataEntity.isArray(items)) {
            throw new Error('Invalid item prepended to DataWindow, expected DataEntity');
        }
        return super.unshift(...items as any);
    }

    concat(...items: ConcatArray<T>[]): DataWindow<T, M>;
    concat(...items: (T | ConcatArray<T>)[]): DataWindow<T, M>;
    concat(...items: (T | ConcatArray<T>)[]): DataWindow<T, M> {
        return new DataWindow<T, M>(
            super.concat(...items),
            this.getMetadata()
        );
    }

    reverse(): DataWindow<T, M> {
        return new DataWindow<T, M>(
            super.reverse(),
            this.getMetadata()
        );
    }

    slice(begin?: number, end?: number): DataWindow<T, M> {
        return new DataWindow<T, M>(
            super.slice(begin, end),
            this.getMetadata()
        );
    }

    splice(start: number, deleteCount?: number): DataWindow<T, M>;
    splice(start: number, deleteCount: number, ...items: T[]): DataWindow<T, M>;
    splice(start: number, deleteCount: number, ...items: T[]): DataWindow<T, M> {
        return new DataWindow<T, M>(
            super.splice(start, deleteCount, ...items),
            this.getMetadata()
        );
    }

    map<U>(
        callbackfn: (value: T, index: number, array: T[]) => U,
        thisArg?: any
    ): DataWindow<U, M> {
        return new DataWindow<U, M>(
            super.map(callbackfn, thisArg),
            this.getMetadata()
        );
    }

    filter<S extends T>(
        callbackfn: (value: T, index: number, array: T[]) => value is S,
        thisArg?: any
    ): DataWindow<S, M>;
    filter(
        callbackfn: (value: T, index: number, array: T[]) => unknown,
        thisArg?: any
    ): DataWindow<T, M> {
        return new DataWindow<T, M>(
            super.filter(callbackfn, thisArg),
            this.getMetadata()
        );
    }
}
