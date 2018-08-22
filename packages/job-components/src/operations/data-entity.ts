/* tslint:disable:variable-name */

import _ from 'lodash';

interface DataEntityMetadata {
    // The date at which this entity was created
    readonly createdAt: Date;
    // Add the ability to specify any additional properties
    [prop: string]: any;
}

const readonlyMetadataKeys: string[] = ['createdAt'];

export class DataEntity {
    protected __metadata: DataEntityMetadata;
    // Add the ability to specify any additional properties
    [prop: string]: any;

    constructor(data: object) {
        if (_.has(data, '__metadata')) {
            throw new Error('DataEntity cannot be constructed with a __metadata property');
        }

        this.__metadata = {
            createdAt: new Date(),
        };

        Object.assign(this, data);
    }

    public getMetadata(key?: string): any {
        if (key) {
            return _.get(this.__metadata, key);
        }
        return this.__metadata;
    }

    public setMetadata(key: string, value: any): void {
        if (_.includes(readonlyMetadataKeys, key)) {
            throw new Error(`Cannot set readonly metadata property ${key}`);
        }

        _.set(this.__metadata, key, value);
    }

    public toJSON(withMetadata?: boolean): object {
        const keys = Object.getOwnPropertyNames(this);
        const data = _.pick(this, _.without(keys, '__metadata'));

        if (withMetadata) {
            return {
                data,
                metadata: this.__metadata,
            };
        }

        return data;
    }
}
