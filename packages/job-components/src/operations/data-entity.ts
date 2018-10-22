import * as L from 'list/methods';
import get from 'lodash.get';
import set from 'lodash.set';
import { locked } from '../utils';

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
        if (input instanceof DataEntity) {
            return input;
        }
        return new DataEntity(input, metadata);
    }

    /**
     * A utility for safely converting an input of an object,
     * or an array of objects, to an array of DataEntities.
     * This will detect if passed an already converted input and return it.
    */
    static makeArray(input: DataInput|DataInput[]|DataListInput): DataEntity[] {
        if (!L.isList(input) && !Array.isArray(input)) {
            return [DataEntity.make(input)];
        }

        const [first] = input;
        if (first instanceof DataEntity) {
            if (L.isList(input)) return L.toArray(input) as DataEntity[];

            return input as DataEntity[];
        }

        const arr = L.isList(input) ? L.toArray(input) : input;
        return arr.map((d) => DataEntity.make(d));
    }

    /**
     * A utility for safely converting an input of an object,
     * an array of objects, a {@link L.List} of objects, to an immutable {@link L.List} of DataEntities.
     * This will detect if passed an already converted input and return it.
    */
    static makeList(input: DataListInput): DataEntityList {
        if (L.isList(input)) {
            const [first] = input;
            if (first instanceof DataEntity) {
                return input as DataEntityList;
            }
            return L.map((d) => DataEntity.make(d), input);
        }

        if (Array.isArray(input)) {
            const [first] = input;
            if (first instanceof DataEntity) {
                return L.from(input) as DataEntityList;
            }
            return L.from(input.map((d) => DataEntity.make(d)));
        }

        return L.list(DataEntity.make(input));
    }

    /**
     * Convert an immutable list to an array,
     * This could have performance impact
    */
    static listToJSON(input: DataEntityList): object[] {
        return input.toArray().map((d) => d.toJSON());
    }

    // Add the ability to specify any additional properties
    [prop: string]: any;

    constructor(data: object, metadata?: object) {
        const createdAt = new Date();
        if (metadata) {
            _metadata.set(this, { ...metadata, createdAt });
        } else {
            _metadata.set(this, {
                createdAt: new Date(),
            });
        }

        copy(this, data);
    }

    @locked()
    getMetadata(key?: string): DataEntityMetadata|any {
        const metadata = _metadata.get(this) as DataEntityMetadata;
        if (key) {
            return get(metadata, key);
        }
        return { ...metadata };
    }

    @locked()
    setMetadata(key: string, value: any): void {
        const readonlyMetadataKeys: string[] = ['createdAt'];
        if (readonlyMetadataKeys.includes(key)) {
            throw new Error(`Cannot set readonly metadata property ${key}`);
        }

        const metadata = _metadata.get(this) as DataEntityMetadata;
        _metadata.set(this, set(metadata, key, value));
    }

    @locked()
    toJSON(withMetadata?: boolean): object {
        const data = {};
        copy(data, this);

        if (withMetadata) {
            const metadata = _metadata.get(this) as DataEntityMetadata;
            return {
                data,
                metadata: {
                    ...metadata
                },
            };
        }

        return data;
    }
}

function copy<T, U>(target: T, source: U) {
    if (typeof target !== 'object' || typeof source !== 'object') {
        return;
    }
    for (const key of Object.keys(source)) {
        target[key] = source[key];
    }
}

export type DataInput = object|DataEntity;
export type DataArrayInput = DataInput|DataInput[];
export type DataListInput = DataInput|DataInput[]|L.List<DataInput>;
export type DataEntityList = L.List<DataEntity>;

interface DataEntityMetadata {
    // The date at which this entity was created
    readonly createdAt: Date;
    // Add the ability to specify any additional properties
    [prop: string]: any;
}
