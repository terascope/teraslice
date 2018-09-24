import _ from 'lodash';
import * as L from 'list/methods';

/**
 * A wrapper for data that can hold additional metadata properties.
 * A DataEntity should be essentially transparent to use within operations
 */

export default class DataEntity {
    /* tslint:disable-next-line:variable-name */
    protected ___metadata: DataEntityMetadata;

    // Add the ability to specify any additional properties
    [prop: string]: any;

    constructor(data: object) {
        if (_.has(data, '___metadata')) {
            throw new Error('DataEntity cannot be constructed with a ___metadata property');
        }

        this.___metadata = {
            createdAt: new Date(),
        };

        Object.assign(this, data);
    }

    getMetadata(key?: string): any {
        if (key) {
            return _.get(this.___metadata, key);
        }
        return this.___metadata;
    }

    setMetadata(key: string, value: any): void {
        const readonlyMetadataKeys: string[] = ['createdAt'];
        if (_.includes(readonlyMetadataKeys, key)) {
            throw new Error(`Cannot set readonly metadata property ${key}`);
        }

        _.set(this.___metadata, key, value);
    }

    toJSON(withMetadata?: boolean): object {
        const keys = Object.getOwnPropertyNames(this);
        const data = _.pick(this, _.without(keys, '___metadata'));

        if (withMetadata) {
            return {
                data,
                metadata: this.___metadata,
            };
        }

        return data;
    }
}

export type DataInput = object|DataEntity;
export type DataArrayInput = DataInput|DataInput[];
export type DataListInput = DataInput|DataInput[]|L.List<DataInput>;
export type DataEntityList = L.List<DataEntity>;

/**
 * A utility for safely converting an object a DataEntity.
 * This will detect if passed an already converted input and return it.
*/
export function toDataEntity(input: DataInput): DataEntity {
    if (input instanceof DataEntity) {
        return input;
    }
    return new DataEntity(input);
}

/**
 * A utility for safely converting an input of an object,
 * or an array of objects, to an array of DataEntities.
 * This will detect if passed an already converted input and return it.
*/
export function toDataEntities(input: DataInput|DataInput[]): DataEntity[] {
    if (!_.isArray(input)) {
        return [toDataEntity(input)];
    }
    const [first] = input;
    if (first instanceof DataEntity) {
        return input as DataEntity[];
    }
    return _.map(input, toDataEntity);
}

/**
 * A utility for safely converting an input of an object,
 * an array of objects, a {@link L.List} of objects, to an immutable {@link L.List} of DataEntities.
 * This will detect if passed an already converted input and return it.
*/
export function toDataEntityList(input: DataListInput): DataEntityList {
    if (L.isList(input)) {
        const [first] = input;
        if (first instanceof DataEntity) {
            return input as DataEntityList;
        }
        return L.map(toDataEntity, input);
    }

    if (_.isArray(input)) {
        const [first] = input;
        if (first instanceof DataEntity) {
            return L.from(input) as DataEntityList;
        }
        return L.from(_.map(input, toDataEntity));
    }

    return L.list(toDataEntity(input));
}

interface DataEntityMetadata {
    // The date at which this entity was created
    readonly createdAt: Date;
    // Add the ability to specify any additional properties
    [prop: string]: any;
}
