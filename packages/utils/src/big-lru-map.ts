/* eslint-disable max-classes-per-file */

import LRUMap from 'mnemonist/lru-map';
import { BigMap } from '@terascope/utils';

/**
* This used to ignore the init size of
* the array in LRUMap. Doing this will avoid
* running out of memory at 12 million records.
* */
class FlexibleArray {
    constructor() {
        return [];
    }
}

export class BigLruMap<V> extends LRUMap<string, V> {
    constructor(cacheSize: number) {
        super(FlexibleArray as any, FlexibleArray as any, cacheSize);
        // @ts-expect-error
        this.items = new BigMap();
    }
}
