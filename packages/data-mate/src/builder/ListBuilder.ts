import { coerceToType } from '@terascope/core-utils';
import { Maybe } from '@terascope/types';
import { BuilderOptions, Builder } from './Builder.js';
import { VectorType } from '../vector/index.js';
import { WritableData } from '../core/index.js';

export class ListBuilder<T = unknown> extends Builder<readonly Maybe<T>[]> {
    _valueFrom = coerceToType<readonly Maybe<T>[]>(this.config, this.childConfig);

    constructor(
        data: WritableData<readonly Maybe<T>[]>,
        options: BuilderOptions
    ) {
        super(VectorType.List, data, options);
    }
}
