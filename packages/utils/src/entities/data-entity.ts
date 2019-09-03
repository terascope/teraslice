import { isSimpleObject } from '../objects';
import {
    parseJSON,
    getTypeOf,
    ensureBuffer,
    isBuffer
} from '../utils';
import * as i from './interfaces';
import * as utils from './utils';

/**
 * A wrapper for data that can hold additional metadata properties.
 * A DataEntity should be essentially transparent to use within operations.
 *
 * IMPORTANT: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
 * to create DataEntities that are significantly faster (600x-1000x faster).
 */
export class DataEntity<T extends object = object, M extends object = object> {
    /**
     * A utility for safely converting an object a `DataEntity`.
     * If the input is a DataEntity it will return it and have no side-effect.
     * If you want a create new DataEntity from an existing DataEntity
     * either use `new DataEntity` or shallow clone the input before
     * passing it to `DataEntity.make`.
     */
    static make<T extends object = object>(input: DataInput, metadata?: object): DataEntity<T> {
        if (DataEntity.isDataEntity(input)) return input;
        return new DataEntity(input, metadata);
    }

    /**
     * A barebones method for creating data-entities. This does not do type detection
     * and returns both the metadata and entity
     */
    static makeRaw<T extends object = object>(
        input?: T,
        metadata?: object
    ): { entity: DataEntity<T>; metadata: i.DataEntityMetadata } {
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
    static fromBuffer<T extends object = object>(
        input: Buffer|string,
        opConfig: i.EncodingConfig = {},
        metadata?: object
    ): DataEntity<T> {
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
    static makeArray<T extends object = object>(input: DataInput | DataInput[]): DataEntity<T>[] {
        if (!Array.isArray(input)) {
            return [DataEntity.make(input)];
        }

        if (DataEntity.isDataEntityArray(input)) {
            return input;
        }

        return input.map((d) => DataEntity.make(d));
    }

    /**
     * Verify that an input is the `DataEntity`
     */
    static isDataEntity(input: any): input is DataEntity<object> {
        return Boolean(input != null && input[i.__IS_ENTITY_KEY]);
    }

    /**
     * Verify that an input is an Array of DataEntities,
     */
    static isDataEntityArray(input: any): input is DataEntity<object>[] {
        if (input == null) return false;
        if (!Array.isArray(input)) return false;
        if (input.length === 0) return true;
        return DataEntity.isDataEntity(input[0]);
    }

    /**
     * Safely get the metadata from a `DataEntity`.
     * If the input is object it will get the property from the object
     */
    static getMetadata(input: DataInput, key?: string): any {
        if (input == null) return null;

        if (DataEntity.isDataEntity(input)) {
            return input.getMetadata(key);
        }

        return key ? input[key] : undefined;
    }

    // Add the ability to specify any additional properties
    [prop: string]: any;
    private [i.__DATAENTITY_METADATA_KEY]: i.__DataEntityProps<M>;

    constructor(data: T|null|undefined, metadata?: M) {
        if (data && !isSimpleObject(data)) {
            throw new Error(`Invalid data source, must be an object, got "${getTypeOf(data)}"`);
        }

        utils.defineProperties(this, utils.makeMetadata(metadata));

        if (data) Object.assign(this, data);
    }

    /**
     * Get the metadata for the DataEntity.
     * If a key is specified, it will get that property of the metadata
    */
    getMetadata<K extends keyof i.DataEntityMetadata>(key?: K): i.DataEntityMetadata[K] | any {
        if (key) {
            return this[i.__DATAENTITY_METADATA_KEY].metadata[key];
        }
        return this[i.__DATAENTITY_METADATA_KEY].metadata;
    }

    /**
     * Given a key and value set the metadata on the record
    */
    setMetadata(key: keyof M|keyof i.DataEntityMetadata|string, value: any): void {
        if (key === '_createTime') {
            throw new Error(`Cannot set readonly metadata property ${key}`);
        }

        this[i.__DATAENTITY_METADATA_KEY].metadata[key] = value;
    }

    /**
     * Get the raw data, usually used for encoding type `raw`
     * If there is no data, an error will be thrown
    */
    getRawData(): Buffer {
        const buf = this[i.__DATAENTITY_METADATA_KEY].rawData;
        if (isBuffer(buf)) return buf;
        throw new Error('No data has been set');
    }

    /**
     * Set the raw data, usually used for encoding type `raw`
     * If given `null`, it will unset the data
    */
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

export type DataInput = object | DataEntity;
export type DataArrayInput = DataInput | DataInput[];
