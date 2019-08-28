import isPlainObject from 'is-plain-object';
import { fastAssign } from '../objects';
import {
    isFunction,
    parseJSON,
    getTypeOf,
    ensureBuffer
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
export class DataEntity<T extends object = object> {
    /**
     * A utility for safely converting an object a `DataEntity`.
     * If the input is a DataEntity it will return it and have no side-effect.
     * If you want a create new DataEntity from an existing DataEntity
     * either use `new DataEntity` or shallow clone the input before
     * passing it to `DataEntity.make`.
     *
     * NOTE: `DataEntity.make` is different from using `new DataEntity`
     * because it attaching it doesn't shallow cloning the object
     * onto the `DataEntity` instance, this is significatly faster and so it
     * is recommended to use this in production.
     */
    static make<T extends object = object>(input: DataInput, metadata?: object): DataEntity<T> {
        if (input == null) return DataEntity.makeRaw({}, metadata).entity;
        if (DataEntity.isDataEntity(input)) return input;
        if (!isPlainObject(input)) {
            throw new Error(`Invalid data source, must be an object, got "${getTypeOf(input)}"`);
        }

        return DataEntity.makeRaw(input, metadata).entity;
    }

    /**
     * A barebones method for creating data-entities. This does not do type detection
     * and returns both the metadata and entity
     */
    static makeRaw<T extends object = object>(
        input?: T,
        metadata?: object
    ): { entity: DataEntity<T>; metadata: i.DataEntityMetadata } {
        const m = utils.makeMetadata(metadata);
        const entity = makeRawEntity(input || {}, m);
        return {
            entity,
            metadata: m,
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
        if (input == null) return false;
        if (input instanceof DataEntity) return true;
        if (input[i.IS_ENTITY_KEY]) return true;
        return isFunction(input.getMetadata)
            && isFunction(input.setMetadata)
            && isFunction(input.toBuffer);
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
            return key ? input.getMetadata(key) : input.getMetadata();
        }

        return key ? input[key] : undefined;
    }

    // Add the ability to specify any additional properties
    [prop: string]: any;

    constructor(data: T, metadata?: object) {
        const m = utils.makeMetadata(metadata);
        utils.makeDataEntityObj(this, m);

        if (data == null) return;

        if (!isPlainObject(data) && !DataEntity.isDataEntity(data)) {
            throw new Error(`Invalid data source, must be an object, got "${getTypeOf(data)}"`);
        }

        fastAssign(this, data);
    }

    /**
     * Get the metadata for the DataEntity.
     * If a key is specified, it will get that property of the metadata
    */
    getMetadata<K extends keyof i.DataEntityMetadata>(key?: K): i.DataEntityMetadata[K] | any {
        if (key) {
            return this[i.METADATA_KEY][key];
        }
        return this[i.METADATA_KEY];
    }

    /**
     * Given a key and value set the metadata on the record
    */
    setMetadata(key: string, value: any): void {
        const readonlyMetadataKeys: string[] = ['_createTime'];
        if (readonlyMetadataKeys.includes(key)) {
            throw new Error(`Cannot set readonly metadata property ${key}`);
        }

        this[i.METADATA_KEY][key] = value;
    }

    /**
     * Get the raw data, usually used for encoding type `raw`
    */
    getRawData(): Buffer {
        return this[i.RAWDATA_KEY];
    }

    /**
     * Set the raw data, usually used for encoding type `raw`
    */
    setRawData(buf: Buffer|string): void {
        this[i.RAWDATA_KEY] = ensureBuffer(buf, 'utf8');
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
            return Buffer.from(JSON.stringify(this));
        }

        throw new Error(`Unsupported encoding type, got "${_encoding}"`);
    }
}

function makeRawEntity<T extends object, M extends i.DataEntityMetadata>(
    input: T,
    metadata: M
): DataEntity<T> {
    const entity = input as DataEntity<T>;
    Object.setPrototypeOf(entity, DataEntity.prototype);
    utils.makeDataEntityObj(entity, metadata);
    return entity;
}

export type DataInput = object | DataEntity;
export type DataArrayInput = DataInput | DataInput[];
