import { castArray } from '@terascope/utils';
import { DataTypeFieldConfig } from '@terascope/types';
import { Builder, BuilderOptions, copyVectorToBuilder } from './Builder';
import { Vector, VectorType } from '../vector';
import { isSameFieldConfig, WritableData } from '../core';

export class ListBuilder<T = unknown> extends Builder<Vector<T>> {
    valueConfig: Readonly<DataTypeFieldConfig>;
    constructor(
        data: WritableData<Vector<T>>,
        options: BuilderOptions
    ) {
        super(VectorType.List, data, options);
        this.valueConfig = Object.freeze({
            ...this.config,
            array: false,
        });
    }

    valueFrom(values: unknown): Vector<any> {
        if (values instanceof Vector) {
            if (isSameFieldConfig(values.config, this.valueConfig)) return values;

            return copyVectorToBuilder(values, Builder.make(
                WritableData.make(values.size),
                {
                    childConfig: this.childConfig,
                    config: this.valueConfig,
                    name: this.name,
                }
            ));
        }

        const arr = castArray(values);
        const builder = Builder.make(
            WritableData.make(arr.length),
            {
                childConfig: this.childConfig,
                config: this.valueConfig,
                name: this.name,
            }
        );

        for (const value of arr) {
            builder.append(value);
        }

        return builder.toVector();
    }
}
