import { DataEntity } from './data-entity';
import * as i from './interfaces';
import * as utils from './utils';
import { getValidDate } from '../dates';

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
    static make(input: DataEntity[]|DataWindow, key?: string): DataWindow {
        if (DataWindow.isDataWindow(input)) {
            return input;
        }
        const window = new DataWindow(...input);
        if (key) {
            window.setKey(key);
        }
        return window;
    }

    static isDataWindow(input: any): input is DataWindow {
        return input instanceof DataWindow;
    }

    static [Symbol.hasInstance](instance: any): boolean {
        return Boolean(instance != null && instance[i.__IS_WINDOW_KEY] === true);
    }

    private readonly [i.__DATAWINDOW_METADATA_KEY]: i.DataWindowMetadata & M;
    private readonly [i.__IS_WINDOW_KEY]: true;

    constructor(...docs: T[]) {
        super(...docs);
        utils.defineWindowProperties(this);
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
    getKey(): string {
        return '';
    }

    /**
     * Set the unique `_key` for the window
     *
     * If no `_key` is found, an error will be thrown
    */
    setKey(_key: string|number): void {}

    /**
     * Get the time at which this window was created.
    */
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
    getStartTime(): Date|false|undefined {
        return undefined;
    }

    /**
     * Set the window start time
     *
     * If the value is empty it will set the time to now.
     * If an invalid date is given, an error will be thrown.
     */
    setStartTime(_val?: string|number|Date): void {}

    /**
     * Get the window completion time
     *
     * If none is found, `undefined` will be returned.
     * If an invalid date is found, `false` will be returned.
    */
    getFinishTime(): Date|false|undefined {
        return undefined;
    }

    /**
     * Set the window completion time
     *
     * If the value is empty it will set the time to now.
     * If an invalid date is given, an error will be thrown.
     */
    setFinishTime(_val?: string|number|Date): void {}
}
