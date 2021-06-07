import { coerceToType } from '@terascope/utils';
import { Maybe } from '@terascope/types';
import { BuilderOptions } from './Builder';
import { VectorType } from '../vector';
import { WritableData } from '../core';
import { BuilderWithCache } from './BuilderWithCache';

export class ListBuilder<T = unknown> extends BuilderWithCache<readonly Maybe<T>[]> {
    _valueFrom = coerceToType<readonly Maybe<T>[]>(this.config, this.childConfig);

    constructor(
        data: WritableData<readonly Maybe<T>[]>,
        options: BuilderOptions
    ) {
        super(VectorType.List, data, options);
    }
}
