import { fastMap } from './arrays';
import { fastAssign, isFunction, isPlainObject, parseJSON, getTypeOf } from './utils';

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
    static makeRaw<T extends object = object>(input?: T, metadata?: object): { entity: DataEntity<T>, metadata: DataEntityMetadata } {
        const entity = makeEntity(input || {});
        return {
            entity,
            metadata: makeMetadata(entity, metadata),
        };
    }

    /**
     * A utility for safely converting an `Buffer` to a `DataEntity`.
     * @param input A `Buffer` to parse to JSON
     * @param opConfig The operation config used to get the encoding type of the Buffer, defaults to "json"
     * @param metadata Optionally add any metadata
    */
    static fromBuffer<T extends object = object>(input: Buffer, opConfig: EncodingConfig = {}, metadata?: object): DataEntity<T> {
        const { _encoding = 'json' } = opConfig || {};
        if (_encoding === 'json') {
            return DataEntity.make(parseJSON(input), metadata);
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

        Object.defineProperty(this, '__isDataEntity', {
            value: true,
            writable: false,
            enumerable: false
        });

        if (data == null) return;

        if (!isPlainObject(data) && !DataEntity.isDataEntity(data)) {
            throw new Error(`Invalid data source, must be an object, got "${getTypeOf(data)}"`);
        }

        fastAssign(this, data);
    }

    getMetadata(): DataEntityMetadata;
    getMetadata(key: string): any;
    getMetadata(key?: string): DataEntityMetadata | any {
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

function getMetadata(ctx: any, key?: string): DataEntityMetadata | any {
    const metadata = _metadata.get(ctx) as DataEntityMetadata;
    if (key) {
        return metadata[key];
    }
    return metadata;
}

function setMetadata(ctx: any, key: string, value: string): void {
    const readonlyMetadataKeys: string[] = ['createdAt'];
    if (readonlyMetadataKeys.includes(key)) {
        throw new Error(`Cannot set readonly metadata property ${key}`);
    }

    const metadata = _metadata.get(ctx) as DataEntityMetadata;
    metadata[key] = value;
    _metadata.set(ctx, metadata);
}

function toBuffer(ctx: any, opConfig: EncodingConfig): Buffer {
    const { _encoding = 'json' } = opConfig;
    if (_encoding === 'json') {
        return Buffer.from(JSON.stringify(ctx));
    }

    throw new Error(`Unsupported encoding type, got "${_encoding}"`);
}

function makeMetadata<T extends object, M extends object>(entity: T, metadata?: M) {
    const newMetadata = { createdAt: Date.now(), ...metadata };
    _metadata.set(entity, newMetadata);
    return newMetadata;
}

function makeEntity<T extends object>(input: T): DataEntity<T> {
    const entity = input as DataEntity<T>;
    Object.defineProperties(entity, dataEntityProperties);
    return entity;
}

const dataEntityProperties = {
    __isDataEntity: {
        value: true,
        enumerable: false,
        writable: false,
    },
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
};

/** an encoding focused interfaces */
export interface EncodingConfig {
    _op?: string;
    _encoding?: DataEncoding;
}

export type DataInput = object | DataEntity;
export type DataArrayInput = DataInput | DataInput[];

interface DataEntityMetadata {
    // The date at which this entity was created
    readonly createdAt: number;
    // Add the ability to specify any additional properties
    [prop: string]: any;
}

/**
 * available data encoding types
*/
export type DataEncoding = 'json';

/** A list of supported encoding formats */
export const dataEncodings: DataEncoding[] = ['json'];
