import { DataEntity } from './data-entity';
import * as i from './interfaces';
import * as utils from './utils';
import { getValidDate, getUnixTime } from '../dates';
import { locked } from '../misc';
import { getTypeOf } from '../utils';

/**
 * Acts as an array of DataEntities associated to a particular key or time frame.
 * A `DataWindow` should be able to be used in-place of an array in most cases.
 */
export class DataWindow<
    T extends DataEntity = DataEntity,
    M extends Record<string, any> = {}
> extends Array<T> {
    /**
     * A utility for safely creating a `DataWindow`
     */
    static make<T extends DataEntity = DataEntity, M extends Record<string, any> = {}>(
        input: T[]|DataWindow, metadata?: M
    ): DataWindow<T, M> {
        if (DataWindow.isDataWindow(input)) {
            return input as DataWindow<T, M>;
        }
        return new DataWindow(input, metadata);
    }

    /**
     * Verify that an input is a `DataWindow`
     */
    static isDataWindow(input: any): input is DataWindow {
        return input instanceof DataWindow;
    }

    static [Symbol.hasInstance](instance: any): boolean {
        return Boolean(instance != null && instance[i.__IS_WINDOW_KEY] === true);
    }

    private readonly [i.__DATAWINDOW_METADATA_KEY]: i.DataWindowMetadata & M;
    private readonly [i.__IS_WINDOW_KEY]: true;

    // FIXME: validate input
    constructor(docs?: T[], metadata?: M) {
        if (Array.isArray(docs) && docs.length) {
            super(...docs);
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
            return this[i.__DATAWINDOW_METADATA_KEY][key];
        }
        return this[i.__DATAWINDOW_METADATA_KEY];
    }

    /**
     * Given a field and value set the metadata on the record
    */
    setMetadata<K extends string|number>(
        field: K,
        value: any
    ): void;
    setMetadata<K extends keyof i.DataWindowMetadata, V extends i.DataWindowMetadata[K]>(
        field: K,
        value: VRDisplayEvent
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

        this[i.__DATAWINDOW_METADATA_KEY][field] = value as any;
    }

    /**
     * Get the unique `_key` for the window
     *
     * If no `_key` is found, an error will be thrown
    */
    @locked()
    getKey(): string|number {
        const key = this[i.__DATAWINDOW_METADATA_KEY]._key;
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
        this[i.__DATAWINDOW_METADATA_KEY]._key = key;
    }

    /**
     * Get the time at which this window was created.
    */
    @locked()
    getCreateTime(): Date {
        const val = this[i.__DATAWINDOW_METADATA_KEY]._createTime;
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
        const val = this[i.__DATAWINDOW_METADATA_KEY]._startTime;
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
        this[i.__DATAWINDOW_METADATA_KEY]._startTime = unixTime;
    }

    /**
     * Get the window completion time
     *
     * If none is found, `undefined` will be returned.
     * If an invalid date is found, `false` will be returned.
    */
    @locked()
    getFinishTime(): Date|false|undefined {
        const val = this[i.__DATAWINDOW_METADATA_KEY]._finishTime;
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
        this[i.__DATAWINDOW_METADATA_KEY]._finishTime = unixTime;
    }

    // override behaviour of an Array...
    // FIXME: map, reduce, reduceRight, and filter

    slice(begin?: number, end?: number): DataWindow<T, M> {
        return new DataWindow<T, M>(
            super.slice(begin, end),
            this.getMetadata()
        );
    }
}
