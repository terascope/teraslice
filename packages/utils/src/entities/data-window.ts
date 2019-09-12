import { EntityArray, ConcatEntityArray } from './entity-array';
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
    T extends DataEntity = DataEntity,
    M = {}
> extends EntityArray<T> implements e.Entity<T, M & e.EntityMetadata> {
    /**
     * A utility for safely creating a `DataWindow`
     */
    static make<T extends DataWindow>(input: T): T;
    static make<T extends Record<string, any>, M = {}>(
        input: T|T[], metadata?: M
    ): DataWindow<DataEntity<T>, M>;
    static make<T extends DataEntity = DataEntity, M = {}>(
        input: T|T[], metadata?: M
    ): DataWindow<T, M> {
        if (DataWindow.is<T, M>(input)) {
            return input;
        }
        if (DataEntity.is(input) || DataEntity.isArray(input)) {
            return new DataWindow(
                input,
                metadata
            );
        }
        return new DataWindow(
            DataEntity.makeArray(input) as T[],
            metadata
        );
    }

    /**
     * Verify that an input is a `DataWindow`
     */
    static is<T extends DataEntity = DataEntity, M = {}>(input: any): input is DataWindow<T, M> {
        return input instanceof DataWindow;
    }

    /**
     * Verify that an input is an Array of DataWindows
     */
    static isArray<T extends DataEntity = DataEntity, M = {}>(
        input: any
    ): input is DataWindow<T, M>[] {
        if (input == null) return false;
        if (!Array.isArray(input)) return false;
        if (DataWindow.is(input)) return false;
        // an empty array is not a DataWindow array since it
        // can cause issues when trying deal with an arrays of DataWindows
        // vs an array of DataEntities
        if (input.length === 0) return false;
        return input.every(DataWindow.is);
    }

    static [Symbol.hasInstance](instance: any): boolean {
        return utils.isDataWindow(instance);
    }

    private readonly [e.__ENTITY_METADATA_KEY]: {
        metadata: i.DataWindowMetadata & M;
    };
    private readonly [i.__IS_WINDOW_KEY]: true;

    constructor(data?: T|T[], metadata?: M) {
        // sometimes the input will automatically be a number when
        // cloning the a window
        if (data != null && typeof data !== 'number') {
            const errMsg = 'Invalid input to DataWindow, expected at least one DataEntity';

            if (DataEntity.is(data)) {
                super(data);
            } else if (DataEntity.isArray(data)) {
                super(...data);
            } else if (Array.isArray(data) && (data as any).length) {
                throw new Error(`${errMsg}, got an array of ${getTypeOf(data[0])}s`);
            } else {
                throw new Error(`${errMsg}, got ${getTypeOf(data)}`);
            }
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

    /**
     * Convert a DataWindow to a native javascript array
    */
    toArray(): Array<T> {
        return super.slice() as Array<T>;
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

    concat(...items: ConcatEntityArray<T>[]): DataWindow<T, M>;
    concat(...items: (T | ConcatEntityArray<T>)[]): DataWindow<T, M>;
    concat(...items: (T | ConcatEntityArray<T>)[]): DataWindow<T, M> {
        return new DataWindow<T, M>(
            super.concat(...items as any),
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

    map<U extends DataEntity>(
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
            super.filter(callbackfn as any, thisArg),
            this.getMetadata()
        );
    }

    [n: number]: T;
}

/**
 * Make a windowed result from an a variety of inputs.
 * Used when returning results from a processor
 *
 * @returns a Window or Multiple Windows
*/
export type EntityResult =
    Record<string, any>
    |(Record<string, any>[])
    |DataEntity
    |(DataEntity[])
    |DataWindow
    |(DataWindow[]);

export function makeWindowResult(
    input: EntityResult
): DataWindow|DataWindow[] {
    if (DataWindow.is(input)) return input;
    if (DataWindow.isArray(input)) return input;
    return DataWindow.make<any>(input);
}
