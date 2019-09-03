/* eslint-disable max-len */
import { isSimpleObject } from '../objects';
import { AnyObject } from '../interfaces';
import {
    parseJSON,
    getTypeOf,
    ensureBuffer,
    isBuffer
} from '../utils';
import * as i from './interfaces';
import * as utils from './utils';
import { locked } from '../misc';

/**
 * A wrapper for data that can hold additional metadata properties.
 * A DataEntity should be essentially transparent to use within operations.
 *
 * NOTE: Use `DataEntity.make`, `DataEntity.makeRaw`, `DataEntity.fromBuffer`
 * and `DataEntity.makeArray` in production for potential performance gains
 */
export class DataEntity<
    T extends AnyObject = AnyObject,
    M extends i.EntityMetadataType = any
> {
    /**
     * A utility for safely converting an object a `DataEntity`.
     * If the input is a DataEntity it will return it and have no side-effect.
     * If you want a create new DataEntity from an existing DataEntity
     * either use `new DataEntity` or shallow clone the input before
     * passing it to `DataEntity.make`.
     */
    static make<T extends DataEntity<any, any>, M extends i.EntityMetadataType = any>(
        input: T,
        metadata?: M
    ): T;
    static make<T extends AnyObject = AnyObject, M extends i.EntityMetadataType = any>(
        input: AnyObject,
        metadata?: M
    ): DataEntity<T, M>;
    static make<T extends AnyObject|DataEntity<any, any> = AnyObject, M extends i.EntityMetadataType = any>(
        input: T,
        metadata?: M
    ): T|DataEntity<T, M> {
        if (DataEntity.isDataEntity(input)) return input;
        return new DataEntity(input, metadata);
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
        if (!DataEntity.isDataEntity(input)) {
            throw new Error(`Invalid input to fork, expected DataEntity, got ${getTypeOf(input)}`);
        }
        if (withData) {
            return DataEntity.make(input, input.getMetadata()) as T;
        }
        return DataEntity.make({}, input.getMetadata()) as T;
    }

    /**
     * A barebones method for creating data-entities.
     * @returns the metadata and entity
     */
    static makeRaw<T extends AnyObject = AnyObject, M extends i.EntityMetadataType = any>(
        input?: T,
        metadata?: M
    ): { entity: DataEntity<T, M>; metadata: i.EntityMetadata<M> } {
        const entity = new DataEntity(input, metadata);
        return {
            entity,
            metadata: entity.getMetadata(),
        };
    }

    /**
     * A utility for safely converting an `Buffer` to a `DataEntity`.
     * @param input A `Buffer` to parse to JSON
     * @param opConfig The operation config used to get the encoding type of the Buffer,
     * defaults to "json"
     * @param metadata Optionally add any metadata
     */
    static fromBuffer<T extends AnyObject = AnyObject, M extends i.EntityMetadataType = any>(
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
     * A utility for safely converting an input of an object,
     * or an array of objects, to an array of DataEntities.
     * This will detect if passed an already converted input and return it.
     */
    static makeArray<T extends AnyObject = AnyObject, M extends i.EntityMetadataType = any>(
        input: DataArrayInput
    ): DataEntity<T, M>[] {
        if (!Array.isArray(input)) {
            return [DataEntity.make(input)];
        }

        if (DataEntity.isDataEntityArray<T, M>(input)) {
            return input;
        }

        return input.map((d) => DataEntity.make(d));
    }

    /**
     * Verify that an input is the `DataEntity`
     */
    static isDataEntity<T extends AnyObject = AnyObject, M extends i.EntityMetadataType = any>(
        input: any
    ): input is DataEntity<T, M> {
        return Boolean(input != null && input[i.__IS_ENTITY_KEY] === true);
    }

    /**
     * Verify that an input is an Array of DataEntities,
     */
    static isDataEntityArray<T extends AnyObject = AnyObject, M extends i.EntityMetadataType = any>(
        input: any
    ): input is DataEntity<T, M>[] {
        if (input == null) return false;
        if (!Array.isArray(input)) return false;
        if (input.length === 0) return true;
        return DataEntity.isDataEntity(input[0]);
    }

    /**
     * Safely get the metadata from a `DataEntity`.
     * If the input is object it will get the property from the object
     */
    static getMetadata(input: DataInput, key?: i.EntityMetadataKey<AnyObject>) {
        if (input == null) return null;

        if (DataEntity.isDataEntity(input)) {
            return key ? input.getMetadata(key) : input.getMetadata();
        }

        return key ? input[key as string] : undefined;
    }

    // Add the ability to specify any additional properties
    [prop: string]: any;

    private readonly [i.__DATAENTITY_METADATA_KEY]: i.__DataEntityProps<M>;
    private readonly [i.__IS_ENTITY_KEY]: true;

    constructor(data: T|null|undefined, metadata?: M) {
        if (data && !isSimpleObject(data)) {
            throw new Error(`Invalid data source, must be an object, got "${getTypeOf(data)}"`);
        }

        utils.defineProperties(this);
        this[i.__DATAENTITY_METADATA_KEY].metadata = utils.makeMetadata(metadata);

        if (data) {
            Object.assign(this, data);
        }
    }

    /**
     * Get the metadata for the DataEntity.
     * If a key is specified, it will get that property of the metadata
    */
    getMetadata(key?: undefined): i.EntityMetadata<M>;
    getMetadata<K extends i.EntityMetadataKey<M>>(key: K): i.EntityMetadataValue<M, K>;

    @locked()
    getMetadata<K extends i.EntityMetadataKey<M>>(key?: K): i.EntityMetadataValue<M, K>|i.EntityMetadata<M> {
        if (key) {
            return this[i.__DATAENTITY_METADATA_KEY].metadata[key];
        }
        return this[i.__DATAENTITY_METADATA_KEY].metadata;
    }

    /**
     * Given a key and value set the metadata on the record
    */

    @locked()
    setMetadata<K extends i.EntityMetadataKey<M>, V extends i.EntityMetadataValue<M, K>>(
        key: K,
        value: V
    ): void {
        if (key === '_createTime') {
            throw new Error(`Cannot set readonly metadata property ${key}`);
        }

        this[i.__DATAENTITY_METADATA_KEY].metadata[key] = value as any;
    }

    /**
     * Get the unique document `_key` from the metadata.
     * If no `_key` is found, an error will be thrown
    */
    @locked()
    getKey(): string|number {
        const key = this.getMetadata('_key');
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
        return this.setMetadata('_key', key);
    }

    /**
     * Get the raw data, usually used for encoding type `raw`
     * If there is no data, an error will be thrown
    */
    @locked()
    getRawData(): Buffer {
        const buf = this[i.__DATAENTITY_METADATA_KEY].rawData;
        if (isBuffer(buf)) return buf;
        throw new Error('No data has been set');
    }

    /**
     * Set the raw data, usually used for encoding type `raw`
     * If given `null`, it will unset the data
    */
    @locked()
    setRawData(buf: Buffer|string|null): void {
        if (buf == null) {
            this[i.__DATAENTITY_METADATA_KEY].rawData = null;
            return;
        }
        this[i.__DATAENTITY_METADATA_KEY].rawData = ensureBuffer(buf, 'utf8');
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
}

export type DataInput = AnyObject | DataEntity;
export type DataArrayInput = DataInput | DataInput[];
