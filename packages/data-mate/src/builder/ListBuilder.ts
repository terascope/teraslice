import { castArray } from '@terascope/utils';
import { DataTypeFieldConfig } from '@terascope/types';
import { Builder, BuilderOptions, copyVectorToBuilder } from './Builder';
import { Vector, VectorType } from '../vector';
import { isSameFieldConfig } from '../core';
import { WritableData } from '../data';

export class ListBuilder<T = unknown> extends Builder<Vector<T>> {
    static valueFrom(values: unknown, thisArg: ListBuilder<any>): Vector<any> {
        const config = getValueConfig(thisArg.config);

        if (values instanceof Vector) {
            if (isSameFieldConfig(values.config, config)) return values;

            return copyVectorToBuilder(values, Builder.make(
                config,
                WritableData.make(values.size),
                thisArg.childConfig
            ));
        }

        const arr = castArray(values);
        const builder = Builder.make(
            config,
            WritableData.make(arr.length),
            thisArg.childConfig
        );

        for (const value of arr) {
            builder.append(value);
        }

        return builder.toVector();
    }

    constructor(
        data: WritableData<Vector<T>>,
        options: BuilderOptions<Vector<T>>
    ) {
        super(VectorType.List, data, {
            valueFrom: ListBuilder.valueFrom,
            ...options,
        });
    }
}

const _cache = new WeakMap<Readonly<DataTypeFieldConfig>, Readonly<DataTypeFieldConfig>>();
function getValueConfig(baseConfig: Readonly<DataTypeFieldConfig>): Readonly<DataTypeFieldConfig> {
    const cached = _cache.get(baseConfig);
    if (cached) return cached;

    const config = Object.freeze({
        ...baseConfig,
        array: false,
    });
    _cache.set(baseConfig, config);
    return config;
}
