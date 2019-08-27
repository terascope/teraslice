import isPlainObject from 'is-plain-object';
import { fastMap } from '../arrays';
import { fastAssign } from '../objects';
import { isFunction, parseJSON, getTypeOf } from '../utils';
import * as i from './interfaces';
import * as utils from './utils';

// WeakMaps are used as a memory efficient reference to private data
const _metadata = new WeakMap();

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
        const entity = makeEntity(input || {});
        return {
            entity,
            metadata: makeMetadata(entity, metadata),
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
        input: Buffer,
        opConfig: i.EncodingConfig = {},
        metadata?: object
    ): DataEntity<T> {
        const { _encoding = i.DataEncoding.JSON } = opConfig || {};
        if (_encoding === i.DataEncoding.JSON) {
            return DataEntity.make(parseJSON(input), metadata);
        }

        if (_encoding === i.DataEncoding.RAW) {
            return DataEntity.make({
                data: input,
            }, metadata);
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

        return fastMap(input, (d) => DataEntity.make(d));
    }

    /**
     * Verify that an input is the `DataEntity`
     */
    static isDataEntity(input: any): input is DataEntity<object> {
        if (input == null) return false;
        if (input instanceof DataEntity) return true;
        if (input.__isDataEntity) return true;
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
        makeMetadata(this, metadata);

        utils.setDataEntityProps(this);

        if (data == null) return;

        if (!isPlainObject(data) && !DataEntity.isDataEntity(data)) {
            throw new Error(`Invalid data source, must be an object, got "${getTypeOf(data)}"`);
        }

        fastAssign(this, data);
    }

    getMetadata<K extends keyof i.DataEntityMetadata>(key?: K): i.DataEntityMetadata[K] | any {
        const metadata = _metadata.get(this) as i.DataEntityMetadata;
        if (key) {
            return metadata[key];
        }
        return metadata;
    }

    setMetadata(key: string, value: any): void {
        const readonlyMetadataKeys: string[] = ['_createTime'];
        if (readonlyMetadataKeys.includes(key)) {
            throw new Error(`Cannot set readonly metadata property ${key}`);
        }

        const metadata = _metadata.get(this) as i.DataEntityMetadata;
        metadata[key] = value;
        _metadata.set(this, metadata);
    }

    /**
     * Convert the DataEntity to an encoded buffer
     *
     * @param opConfig The operation config used to get the encoding type of the buffer,
     * @default "json"
     */
    toBuffer(opConfig: i.EncodingConfig = {}): Buffer {
        const { _encoding = i.DataEncoding.JSON } = opConfig;
        if (_encoding === i.DataEncoding.JSON) {
            return Buffer.from(JSON.stringify(this));
        }

        throw new Error(`Unsupported encoding type, got "${_encoding}"`);
    }
}

function makeMetadata<T extends object, M extends object>(entity: T, metadata?: M) {
    const newMetadata = { _createTime: Date.now(), ...metadata };
    _metadata.set(entity, newMetadata);
    return newMetadata;
}

function makeEntity<T extends object>(input: T): DataEntity<T> {
    const entity = input as DataEntity<T>;
    Object.setPrototypeOf(entity, DataEntity.prototype);
    utils.setDataEntityProps(entity);
    return entity;
}

export type DataInput = object | DataEntity;
export type DataArrayInput = DataInput | DataInput[];
