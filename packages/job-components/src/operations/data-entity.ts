import { fastAssign, fastMap, isFunction, isPlainObject, parseJSON } from '../utils';
import kindOf from 'kind-of';
import { DataEncoding } from '../interfaces';

// WeakMaps are used as a memory efficient reference to private data
const _metadata = new WeakMap();

/**
 * A wrapper for data that can hold additional metadata properties.
 * A DataEntity should be essentially transparent to use within operations.
 *
 * IMPORTANT: Use `DataEntity.make`, `DataEntity.fromBuffer` and `DataEntity.makeArray`
 * to create DataEntities that are significantly faster (600x-1000x faster).
 */
export default class DataEntity {
    /**
     * A utility for safely converting an object a `DataEntity`.
     * This will detect if passed an already converted input and return it.
     *
     * NOTE: `DataEntity.make` is different from using `new DataEntity`
     * because it attaching it doesn't shallow cloning the object
     * onto the `DataEntity` instance, this is significatly faster and so it
     * is recommended to use this in production.
    */
    static make(input: DataInput, metadata?: object): DataEntity {
        if (input == null) return new DataEntity({});
        if (DataEntity.isDataEntity(input)) return input;
        if (!isPlainObject(input)) {
            throw new Error(`Invalid data source, must be an object, got "${kindOf(input)}"`);
        }

        Object.defineProperties(input, {
            getMetadata: {
                value(key?: string) {
                    return getMetadata(this, key);
                },
                enumerable: false,
                writable: false
            },
            setMetadata: {
                value(key: string, value: any) {
                    return setMetadata(this, key, value);
                },
                enumerable: false,
                writable: false
            },
            toBuffer: {
                value(opConfig: EncodingConfig = {}) {
                    return toBuffer(this, opConfig);
                },
                enumerable: false,
                writable: false
            }
        });

        const entity = input as DataEntity;
        _metadata.set(entity, Object.assign({ createdAt: Date.now() }, metadata));
        return entity as DataEntity;
    }

    /**
     * A utility for safely converting an `Buffer` to a `DataEntity`.
     * @param input A `Buffer` to parse to JSON
     * @param opConfig The operation config used to get the encoding type of the Buffer, defaults to "json"
     * @param metadata Optionally add any metadata
    */
    static fromBuffer(input: Buffer, opConfig: EncodingConfig = {}, metadata?: object): DataEntity {
        const { _encoding = DataEncoding.JSON } = opConfig || {};
        if (_encoding === DataEncoding.JSON) {
            return DataEntity.make(parseJSON(input), metadata);
        }

        throw new Error(`Unsupported encoding type, got "${_encoding}"`);
    }

    /**
     * A utility for safely converting an input of an object,
     * or an array of objects, to an array of DataEntities.
     * This will detect if passed an already converted input and return it.
    */
    static makeArray(input: DataInput|DataInput[]): DataEntity[] {
        if (!Array.isArray(input)) {
            return [DataEntity.make(input)];
        }

        if (DataEntity.isDataEntityArray(input)) {
            return input;
        }

        return fastMap(input, (d) =>  DataEntity.make(d));
    }

    /**
     * Verify that an input is the `DataEntity`
    */
    static isDataEntity(input: any): input is DataEntity {
        if (input == null) return false;
        if (input instanceof DataEntity) return true;
        return isFunction(input.getMetadata)
            && isFunction(input.setMetadata)
            && isFunction(input.toBuffer);
    }

    /**
     * Verify that an input is an Array of DataEntities,
    */
    static isDataEntityArray(input: any): input is DataEntity[] {
        if (input == null) return false;
        if (!Array.isArray(input)) return false;
        return DataEntity.isDataEntity(input[0]);
    }

    /**
     * Safely get the metadata from a `DataEntity`.
     * If the input is object it will get the property from the object
    */
    static getMetadata(input: DataInput, key: string): any {
        if (input == null) return null;

        if (DataEntity.isDataEntity(input)) {
            return input.getMetadata(key);
        }

        return input[key];
    }

    // Add the ability to specify any additional properties
    [prop: string]: any;

    constructor(data: object, metadata?: object) {
        _metadata.set(this, fastAssign({ createdAt: Date.now() }, metadata));

        if (data == null) return;

        if (DataEntity.isDataEntity(data)) return data;

        if (!isPlainObject(data)) {
            throw new Error(`Invalid data source, must be an object, got "${kindOf(data)}"`);
        }

        fastAssign(this, data);
    }

    getMetadata(key?: string) {
        return getMetadata(this, key);
    }

    setMetadata(key: string, value: any) {
        return setMetadata(this, key, value);
    }

    /**
     * Convert the DataEntity to an encoded buffer
     * @param opConfig The operation config used to get the encoding type of the buffer, defaults to "json"
    */
    toBuffer(opConfig: EncodingConfig = {}): Buffer {
        return toBuffer(this, opConfig);
    }
}

function getMetadata(ctx: any, key?: string): DataEntityMetadata|any {
    const metadata = _metadata.get(ctx) as DataEntityMetadata;
    if (key) {
        return metadata[key];
    }
    return metadata;
}

function setMetadata(ctx: any, key: string, value: string):void {
    const readonlyMetadataKeys: string[] = ['createdAt'];
    if (readonlyMetadataKeys.includes(key)) {
        throw new Error(`Cannot set readonly metadata property ${key}`);
    }

    const metadata = _metadata.get(ctx) as DataEntityMetadata;
    metadata[key] = value;
    _metadata.set(ctx, metadata);
}

function toBuffer(ctx: any, opConfig: EncodingConfig): Buffer {
    const { _encoding = DataEncoding.JSON } = opConfig;
    if (_encoding === DataEncoding.JSON) {
        return Buffer.from(JSON.stringify(ctx));
    }

    throw new Error(`Unsupported encoding type, got "${_encoding}"`);
}

/** an encoding focused interfaces */
export interface EncodingConfig {
    _op?: string;
    _encoding?: DataEncoding;
}

export type DataInput = object|DataEntity;
export type DataArrayInput = DataInput|DataInput[];

interface DataEntityMetadata {
    // The date at which this entity was created
    readonly createdAt: number;
    // Add the ability to specify any additional properties
    [prop: string]: any;
}
