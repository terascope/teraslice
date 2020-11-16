import { v4 as uuid } from 'uuid';
import { joinList, toString } from '@terascope/utils';
import {
    DataTypeFieldConfig, DataTypeFields, Maybe
} from '@terascope/types';
import { Builder, copyVectorToBuilder, transformVectorToBuilder } from '../builder';
import {
    Vector, isVector, VectorType
} from '../vector';
import { ColumnTransformFn, TransformMode } from './interfaces';
import { ReadableData, WritableData } from '../core';

const _vectorIds = new WeakMap<Vector<any>, string>();
export function getVectorId(vector: Vector<any>): string {
    const id = _vectorIds.get(vector);
    if (id) return id;
    const newId = uuid();
    _vectorIds.set(vector, newId);
    return newId;
}

/**
 * Map over the Vector
*/
export function mapVector<T, R = T>(
    vector: Vector<T>,
    transform: ColumnTransformFn<T, R>,
    config?: Partial<DataTypeFieldConfig>,
): Vector<R> {
    const builder = Builder.make<R>(
        new WritableData(vector.size),
        {
            config: { ...vector.config, ...config, ...transform.output },
            childConfig: vector.childConfig,
            name: vector.name,
        },
    );

    if (transform.mode === TransformMode.NONE) {
        return copyVectorToBuilder(vector, builder);
    }

    if (transform.mode === TransformMode.EACH) {
        return mapVectorEach(
            vector, builder, transform.fn
        );
    }

    if (transform.mode === TransformMode.EACH_VALUE) {
        return mapVectorEachValue(
            vector, builder, transform.fn
        );
    }

    throw new Error(`Unknown transformation ${toString(transform)}`);
}

export function mapVectorEach<T, R = T>(
    vector: Vector<T>,
    builder: Builder<R>,
    fn: (value: Maybe<T|Vector<T>>) => Maybe<R|Vector<R>>,
): Vector<R> {
    let i = 0;
    for (const value of vector) {
        builder.set(i++, fn(value));
    }
    return builder.toVector();
}

export function mapVectorEachValue<T, R = T>(
    vector: Vector<T>,
    builder: Builder<R>,
    fn: (value: T) => Maybe<R>,
): Vector<R> {
    function _mapValue(value: T|Vector<T>): Maybe<R> {
        if (!isVector<T>(value)) return fn(value);
        const values: Maybe<R>[] = [];
        for (const val of value) {
            values.push(val != null ? fn(val as any) : null);
        }
        return values as any;
    }

    return transformVectorToBuilder(vector, builder, _mapValue);
}

export function validateFieldTransformArgs<A extends Record<string, any>>(
    schema?: DataTypeFields, requiredArgs?: string[], args?: Partial<A>
): A {
    if (!schema) return {} as any;

    const result = { ...args } as A;

    for (const [name, config] of Object.entries(schema)) {
        const field = name as keyof A;

        const required = requiredArgs?.includes(name);
        if (required && result[field] == null) {
            throw new Error(`Missing required parameter ${field}`);
        }

        const builder = Builder.make(WritableData.emptyData, {
            config,
        });
        if (result[field] != null) {
            result[field] = builder.valueFrom(result[field]) as any;
        }
    }

    return result;
}

export function validateFieldTransformType(
    accepts: VectorType[], vector: Vector<any>
): void {
    if (!accepts?.length) return;
    // if the type is a List, then we need to give the child type
    const type = vector.type === VectorType.List ? Vector.make(ReadableData.emptyData, {
        config: { ...vector.config, array: false }
    }).type : vector.type;

    if (!accepts.includes(type)) {
        throw new Error(`Incompatible with field type ${type}, must be ${joinList(accepts)}`);
    }
}
