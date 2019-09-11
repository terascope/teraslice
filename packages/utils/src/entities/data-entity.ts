/* eslint-disable max-len */
// this file cannot depend on ./data-window

import { getValidDate, getTime } from '../dates';
import { getTypeOf } from '../deps';
import { isSimpleObject } from '../objects';
import { ensureBuffer, isBuffer } from '../buffers';
import { parseJSON } from '../json';
import * as i from './interfaces';
import * as utils from './utils';
import { locked } from '../misc';
import * as e from './entity';

/**
 * Acts as a thin wrapper around a data object to expose additional metadata
 * and convenience methods that used within teraslice pipelines.
 * A `DataEntity` should be able to be used in-place of objects in most cases.
 *
 * NOTE: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
 * in production for potential performance gains
 */
export class DataEntity<
    T = Record<string, any>,
    M = Record<string, any>
> implements e.Entity<T, M> {
    /**
     * A utility for safely converting an object a `DataEntity`.
     * If the input is a DataEntity it will return it and have no side-effect.
     * If you want a create new DataEntity from an existing DataEntity
     * either use `new DataEntity` or shallow clone the input before
     * passing it to `DataEntity.make`.
     */
    static make<T extends DataEntity<any, any>, M = Record<string, any>>(
        input: T,
        metadata?: M
    ): T;
    static make<T extends Record<string, any> = Record<string, any>, M extends i._DataEntityMetadataType = Record<string, any>>(
        input: Record<string, any>,
        metadata?: M
    ): DataEntity<T, M>;
    static make<
        T extends Record<string, any>|DataEntity<any, any> = Record<string, any>,
        M extends i._DataEntityMetadataType = Record<string, any>
    >(input: T, metadata?: M): T|DataEntity<T, M> {
        if (DataEntity.is(input)) {
            if (metadata) {
                for (const [key, val] of Object.entries(metadata)) {
                    input.setMetadata(key, val);
                }
            }
            return input;
        }
        if (utils.isDataWindow(input)) return input;
        return new DataEntity(input, metadata);
    }

    /**
     * A utility for safely converting an input of an object,
     * or an array of objects, to an array of DataEntities.
     * This will detect if passed an already converted input and return it.
     */
    static makeArray<T = Record<string, any>, M = Record<string, any>>(
        input: DataArrayInput
    ): DataEntity<T, M>[] {
        if (!Array.isArray(input)) {
            return [DataEntity.make(input)];
        }
        if (utils.isDataWindow(input)) {
            return input as DataEntity<T, M>[];
        }
        if (DataEntity.isArray<T, M>(input)) {
            return input;
        }
        return input.map((d) => DataEntity.make(d));
    }

    /**
     * Create a new instance of a DataEntity.
     *
     * If the second param `withData` is set to `true`
     * both the data and metadata will be forked, if set
     * to `false` only the metadata will be copied. Defaults
     * to `true`
     */
    static fork<T extends DataEntity<any, any> = DataEntity>(
        input: T,
        withData = true
    ): T {
        if (!DataEntity.is(input)) {
            throw new Error(`Invalid input to fork, expected DataEntity, got ${getTypeOf(input)}`);
        }
        const { _createTime, ...metadata } = input.getMetadata();
        if (withData) {
            return DataEntity.make(input, metadata) as T;
        }
        return DataEntity.make({}, metadata) as T;
    }

    /**
     * A utility for converting a `Buffer` to a `DataEntity`,
     * using the DataEntity encoding.
     *
     * @param input A `Buffer` to parse to JSON
     * @param opConfig The operation config used to get the encoding type of the Buffer,
     * defaults to "json"
     * @param metadata Optionally add any metadata
     */
    static fromBuffer<T = Record<string, any>, M = Record<string, any>>(
        input: Buffer|string,
        opConfig: i.EncodingConfig = {},
        metadata?: M
    ): DataEntity<T, M> {
        const { _encoding = i.DataEncoding.JSON } = opConfig || {};
        if (_encoding === i.DataEncoding.JSON) {
            return DataEntity.make(parseJSON(input), metadata);
        }

        if (_encoding === i.DataEncoding.RAW) {
            const entity = DataEntity.make({}, metadata);
            entity.setRawData(input);
            return entity;
        }

        throw new Error(`Unsupported encoding type, got "${_encoding}"`);
    }

    /**
     * Verify that an input is the `DataEntity`
     */
    static isDataEntity<T = Record<string, any>, M = Record<string, any>>(
        input: unknown
    ): input is DataEntity<T, M> {
        return utils.isDataEntity(input);
    }

    /**
     * Verify that an input is the `DataEntity`
     */
    static is(input: any): input is DataEntity<T, M> {
        return DataEntity.isDataEntity(input);
    }

    /**
     * Verify that an input is an of `DataEntities`
     */
    static isDataEntityArray<T = Record<string, any>, M = Record<string, any>>(
        input: unknown
    ): input is DataEntity<T, M>[] {
        if (input == null) return false;
        if (!Array.isArray(input)) return false;
        if (input.length === 0) return true;
        return utils.isDataEntity(input[0]);
    }

    /**
     * Verify that an input is the `DataEntity`
     */
    static isArray(input: unknown): input is DataEntity<T, M>[] {
        return DataEntity.isDataEntityArray(input);
    }

    /**
     * Verify that an input is the `DataEntity`
     */
    static getMetadata<V = any>(input: unknown, field?: string): V|undefined {
        if (input == null) return undefined;

        if (DataEntity.isDataEntity(input)) {
            const val = field ? input.getMetadata(field) : input.getMetadata();
            return val as V|undefined;
        }

        return field ? (input as any)[field] : undefined;
    }

    static [Symbol.hasInstance](instance: unknown): boolean {
        // prevent automatically thinking a base DataEntity is
        // an instance of a class that extends from a DataEntity
        if (this.name !== 'DataEntity' && this.name !== 'Object') {
            return false;
        }
        return utils.isDataEntity(instance);
    }

    private readonly [e.__ENTITY_METADATA_KEY]: {
        metadata: i._DataEntityMetadata<M>;
        rawData: Buffer|null;
    };
    private readonly [i.__IS_DATAENTITY_KEY]: true;

    constructor(data: T|null|undefined, metadata?: M) {
        if (data && !isSimpleObject(data)) {
            throw new Error(`Invalid data source, must be an object, got "${getTypeOf(data)}"`);
        }

        utils.defineEntityProperties(this, metadata);

        if (data) {
            Object.assign(this, data);
        }
    }

    /**
     * Get the metadata for the DataEntity.
     * If a field is specified, it will get that property of the metadata
    */
    getMetadata(key?: undefined): i._DataEntityMetadata<M>;
    getMetadata<K extends i.DataEntityMetadataValue<M>>(key: K): i.EntityMetadataValue<M, K>;

    @locked()
    getMetadata<K extends i.DataEntityMetadataValue<M>>(key?: K): i.EntityMetadataValue<M, K>|i._DataEntityMetadata<M> {
        if (key) {
            return this[e.__ENTITY_METADATA_KEY].metadata[key];
        }
        return this[e.__ENTITY_METADATA_KEY].metadata;
    }

    /**
     * Given a field and value set the metadata on the record
    */
    @locked()
    setMetadata<K extends i.DataEntityMetadataValue<M>, V extends i.EntityMetadataValue<M, K>>(
        field: K,
        value: V
    ): void {
        if (field == null || field === '') {
            throw new Error('Missing field to set in metadata');
        }
        if (field === '_createTime') {
            throw new Error(`Cannot set readonly metadata property ${field}`);
        }
        this[e.__ENTITY_METADATA_KEY].metadata[field] = value as any;
    }

    /**
     * Get the unique document `_key` from the metadata.
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
     * Set the unique document `_key` from the metadata.
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
     * Get the time at which this entity was created.
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
     * Get the time at which the data was ingested into the source data
     *
     * If none is found, `undefined` will be returned.
     * If an invalid date is found, `false` will be returned.
    */
    @locked()
    getIngestTime(): Date|false|undefined {
        const val = this[e.__ENTITY_METADATA_KEY].metadata._ingestTime;
        if (val == null) return undefined;
        return getValidDate(val);
    }

    /**
     * Set the time at which the data was ingested into the source data
     *
     * If the value is empty it will set the time to now.
     * If an invalid date is given, an error will be thrown.
     */
    @locked()
    setIngestTime(val?: string|number|Date): void {
        const unixTime = getTime(val);
        if (unixTime === false) {
            throw new Error(`Invalid date format, got ${getTypeOf(val)}`);
        }
        this[e.__ENTITY_METADATA_KEY].metadata._ingestTime = unixTime;
    }

    /**
     * Get the time at which the data was consumed by the reader.
     *
     * If none is found, `undefined` will be returned.
     * If an invalid date is found, `false` will be returned.
    */
    @locked()
    getProcessTime(): Date|false|undefined {
        const val = this[e.__ENTITY_METADATA_KEY].metadata._ingestTime;
        if (val == null) return undefined;
        return getValidDate(val);
    }

    /**
    * Set the time at which the data was consumed by the reader
    *
    * If the value is empty it will set the time to now.
    * If an invalid date is given, an error will be thrown.
    */
    @locked()
    setProcessTime(val?: string|number|Date): void {
        const unixTime = getTime(val);
        if (unixTime === false) {
            throw new Error(`Invalid date format, got ${getTypeOf(val)}`);
        }
        this[e.__ENTITY_METADATA_KEY].metadata._ingestTime = unixTime;
    }

    /**
     * Get time associated from a specific field on source data or message
     *
     * If none is found, `undefined` will be returned.
     * If an invalid date is found, `false` will be returned.
    */
    @locked()
    getEventTime(): Date|false|undefined {
        const val = this[e.__ENTITY_METADATA_KEY].metadata._ingestTime;
        if (val == null) return undefined;
        return getValidDate(val);
    }

    /**
     * Set time associated from a specific field on source data or message
     *
     * If the value is empty it will set the time to now.
     * If an invalid date is given, an error will be thrown.
     */
    @locked()
    setEventTime(val?: string|number|Date): void {
        const unixTime = getTime(val);
        if (unixTime === false) {
            throw new Error(`Invalid date format, got ${getTypeOf(val)}`);
        }
        this[e.__ENTITY_METADATA_KEY].metadata._ingestTime = unixTime;
    }

    /**
     * Get the raw data, usually used for encoding type `raw`.
     * If there is no data, an error will be thrown
    */
    @locked()
    getRawData(): Buffer {
        const buf = this[e.__ENTITY_METADATA_KEY].rawData;
        if (isBuffer(buf)) return buf;
        throw new Error('No data has been set');
    }

    /**
     * Set the raw data, usually used for encoding type `raw`
     * If given `null`, it will unset the data
    */
    @locked()
    setRawData(buf: Buffer|string|null): void {
        if (buf === null) {
            this[e.__ENTITY_METADATA_KEY].rawData = null;
            return;
        }
        this[e.__ENTITY_METADATA_KEY].rawData = ensureBuffer(buf, 'utf8');
    }

    /**
     * Convert the DataEntity to an encoded buffer
     *
     * @param opConfig The operation config used to get the encoding type of the buffer,
     * @default `json`
     */
    @locked()
    toBuffer(opConfig: i.EncodingConfig = {}): Buffer {
        const { _encoding = i.DataEncoding.JSON } = opConfig;
        if (_encoding === i.DataEncoding.JSON) {
            return utils.jsonToBuffer(this);
        }

        if (_encoding === i.DataEncoding.RAW) {
            return this.getRawData();
        }

        throw new Error(`Unsupported encoding type, got "${_encoding}"`);
    }

    [prop: string]: any;
}

export type DataInput = Record<string, any> | DataEntity;
export type DataArrayInput = DataInput | DataInput[];
