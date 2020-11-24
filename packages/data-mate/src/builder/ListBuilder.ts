import { castArray } from '@terascope/utils';
import { Maybe } from '@terascope/types';
import { Builder, BuilderOptions } from './Builder';
import { VectorType } from '../vector';
import { createArrayValue, WritableData } from '../core';
import { BuilderWithCache } from './BuilderWithCache';

export class ListBuilder<T = unknown> extends BuilderWithCache<readonly Maybe<T>[]> {
    readonly valueBuilder: Builder<T>;
    readonly convertValue: (value: unknown) => Maybe<T>;

    constructor(
        data: WritableData<readonly Maybe<T>[]>,
        options: BuilderOptions
    ) {
        super(VectorType.List, data, options);
        this.valueBuilder = Builder.make<T>(
            WritableData.emptyData,
            {
                childConfig: this.childConfig,
                config: {
                    ...this.config,
                    array: false,
                },
                name: this.name,
            }
        );
        this.convertValue = (value: unknown): Maybe<T> => (
            value != null ? this.valueBuilder.valueFrom(value) : null
        );
    }

    _valueFrom(values: unknown): readonly Maybe<T>[] {
        return createArrayValue(
            castArray(values).map(this.convertValue)
        );
    }
}
