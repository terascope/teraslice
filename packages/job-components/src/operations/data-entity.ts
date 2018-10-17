import * as L from 'list/methods';
import get from 'lodash.get';
import set from 'lodash.set';

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

    // Add the ability to specify any additional properties
    [prop: string]: any;

    constructor(data: object, metadata?: object) {
        _metadata.set(this, Object.assign({}, metadata, {
            createdAt: new Date(),
        }));

        Object.assign(this, data);
    }

    @locked()
    getMetadata(key?: string): DataEntityMetadata|any {
        const metadata = _metadata.get(this);
        if (key) {
            return get(metadata, key);
        }
        return metadata;
    }

    @locked()
    setMetadata(key: string, value: any): void {
        const readonlyMetadataKeys: string[] = ['createdAt'];
        if (readonlyMetadataKeys.includes(key)) {
            throw new Error(`Cannot set readonly metadata property ${key}`);
        }

        const metadata = _metadata.get(this);
        _metadata.set(this, set(metadata, key, value));
    }

    @locked()
    toJSON(withMetadata?: boolean): object {
        if (withMetadata) {
            return {
                data: this,
                metadata: _metadata.get(this),
            };
        }

        return this;
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

function locked() {
    // @ts-ignore
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.configurable = false;
        descriptor.enumerable = false;
        descriptor.writable = false;
    };
}
