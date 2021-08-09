import { coerceToType } from '@terascope/utils';
import { Maybe } from '@terascope/types';
import { BuilderOptions, Builder } from './Builder';
import { VectorType } from '../vector';
import { WritableData } from '../core';

export class ListBuilder<T = unknown> extends Builder<readonly Maybe<T>[]> {
    _valueFrom = coerceToType<readonly Maybe<T>[]>(this.config, this.childConfig);

    constructor(
        data: WritableData<readonly Maybe<T>[]>,
        options: BuilderOptions
    ) {
        super(VectorType.List, data, options);
    }
}
