import { fastAssign, fastMap, isFunction, isPlainObject } from '../utils';

// WeakMaps are used as a memory efficient reference to private data
const _metadata = new WeakMap();

/**
 * A wrapper for data that can hold additional metadata properties.
 * A DataEntity should be essentially transparent to use within operations
 */
export default class DataEntity {
    /**
     * A utility for safely converting an object a DataEntity.
     * This will detect if passed an already converted input and return it.
    */
    static make(input: DataInput, metadata?: object): DataEntity {
        if (DataEntity.isDataEntity(input)) {
            return input;
        }
        return new DataEntity(input, metadata);
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

        return fastMap(input, (d) => new DataEntity(d));
    }

    /**
     * Verify that an input is the DataEntity
    */
    static isDataEntity(input: any): input is DataEntity {
        if (input == null) return false;
        if (input instanceof DataEntity) return true;
        return isFunction(input.getMetadata) && isFunction(input.setMetadata);
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
     * Safely get the metadata from a DataEntity.
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
        if (!isPlainObject(data)) {
            throw new Error(`Invalid data source, must be an object, got ${typeof data}`);
        }

        _metadata.set(this, fastAssign({ createdAt: Date.now() }, metadata));

        fastAssign(this, data);
    }

    getMetadata(key?: string): DataEntityMetadata|any {
        const metadata = _metadata.get(this) as DataEntityMetadata;
        if (key) {
            return metadata[key];
        }
        return metadata;
    }

    setMetadata(key: string, value: any): void {
        const readonlyMetadataKeys: string[] = ['createdAt'];
        if (readonlyMetadataKeys.includes(key)) {
            throw new Error(`Cannot set readonly metadata property ${key}`);
        }

        const metadata = _metadata.get(this) as DataEntityMetadata;
        metadata[key] = value;
        _metadata.set(this, metadata);
    }
}

export type DataInput = object|DataEntity;
export type DataArrayInput = DataInput|DataInput[];

interface DataEntityMetadata {
    // The date at which this entity was created
    readonly createdAt: number;
    // Add the ability to specify any additional properties
    [prop: string]: any;
}
