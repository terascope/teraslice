/* eslint-disable max-classes-per-file */

import { TypedArray } from '@terascope/types';
import LRUMap from 'mnemonist/lru-map';
import { BigMap } from './big-map';

/**
* This used to ignore the init size of
* the array in LRUMap. Doing this will avoid
* running out of memory at 12 million records.
* */
export class FlexibleArray {
    constructor() {
        return [];
    }
}

export class BigLRUMap<V> extends LRUMap<string|number, V> {
    constructor(mapSize: number,
        keyArray: FlexibleArray|TypedArray = FlexibleArray,
        valueArray: FlexibleArray|TypedArray = FlexibleArray) {
        super(keyArray as any, valueArray as any, mapSize);
        // @ts-expect-error
        this.items = new BigMap();
    }
}
