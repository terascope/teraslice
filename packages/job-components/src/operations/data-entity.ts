/* tslint:disable:variable-name */

import get from 'lodash/get';
import has from 'lodash/has';
import set from 'lodash/set';

export interface DataEntityMetadata {
    // Time set by the fetcher at the point when the data is initially brought into the Teraslice pipeline.
    fetchedAt: Date;
    // Add the ability to specify any additional properties
    [prop: string]: any;
}

interface DataEntityMetadataAndData {
    metadata: object;
    data: object;
}

export class DataEntity {
    protected __metadata: DataEntityMetadata;
    [prop: string]: any;

    constructor(data: object) {
        if (has(data, '__metadata')) {
            throw new Error('DataEntity cannot be constructed with a __metadata property');
        }

        this.__metadata = {
            fetchedAt: new Date(),
        };

        Object.assign(this, data);
    }

    public getMetadata(key?: string): any {
        if (key) {
            return get(this.__metadata, key);
        }
        return this.__metadata;
    }

    public setMetadata(key: string, value: any): void {
        set(this.__metadata, key, value);
    }

    public getMetadataAndData(): DataEntityMetadataAndData {
        return {
            data: JSON.parse(JSON.stringify(this)),
            metadata: this.__metadata,
        };
    }
}
