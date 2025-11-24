import { v4 as uuid } from 'uuid';
import { joinList, isArrayLike } from '@terascope/core-utils';
import {
    DataTypeFieldConfig, DataTypeFields, FieldType,
    Maybe, ReadonlyDataTypeFields
} from '@terascope/types';
import { Builder, transformVectorToBuilder } from '../builder/index.js';
import { ListVector, Vector, VectorType } from '../vector/index.js';
import { numericTypes, stringTypes, WritableData } from '../core/index.js';

const _vectorIds = new WeakMap<Vector<any>, string>();

export function getVectorId(vector: Vector<any>): string {
    const id = _vectorIds.get(vector);
    if (id) return id;
    const newId = uuid();
    _vectorIds.set(vector, newId);
    return newId;
}

export function mapVectorEach<T, R = T>(
    vector: Vector<T> | ListVector<T>,
    builder: Builder<R>,
    fn: (value: Maybe<T | readonly Maybe<T>[]>, index: number) => Maybe<R | readonly Maybe<R>[]>,
): Vector<R> {
    let i = 0;

    for (const value of vector) {
        const ind = i++;
        builder.set(ind, fn(value, ind));
    }

    return builder.toVector();
}

export function mapVectorEachValue<T, R = T>(
    vector: Vector<T> | ListVector<T>,
    builder: Builder<R>,
    fn: (value: T, index: number) => Maybe<R>,
): Vector<R> {
    const containsArray = vector.type === VectorType.Tuple || vector.config.array
        || vector.type === VectorType.Any;

    function _mapValue(
        value: T | readonly Maybe<T>[],
        index: number
    ): Maybe<R> | readonly Maybe<R>[] {
        if (containsArray && Array.isArray(value)) {
            return (value as readonly Maybe<T>[]).map((v): Maybe<R> => (
                v != null ? fn(v, index) : null
            ));
        }

        return fn(value as T, index);
    }

    return transformVectorToBuilder(vector, builder, _mapValue);
}

export function dynamicMapVectorEach<T, R = T>(
    vector: Vector<T> | ListVector<T>,
    builder: Builder<R>,
    dynamicFn: (index: number) =>
    (value: Maybe<T | readonly Maybe<T>[]>, index: number) => Maybe<R | readonly Maybe<R>[]>,
): Vector<R> {
    let i = 0;

    for (const value of vector) {
        const ind = i++;
        const fn = dynamicFn(ind);
        builder.set(ind, fn(value, ind));
    }

    return builder.toVector();
}

export function dynamicMapVectorEachValue<T, R = T>(
    vector: Vector<T> | ListVector<T>,
    builder: Builder<R>,
    dynamicFn: (index: number) => (value: T, index: number) => Maybe<R>,
): Vector<R> {
    function _mapValue(
        value: T | readonly Maybe<T>[],
        index: number
    ): Maybe<R> | readonly Maybe<R>[] {
        const fn = dynamicFn(index);

        if (isArrayLike<readonly Maybe<T>[]>(value)) {
            return value.map((v): Maybe<R> => (
                v != null ? fn(v, index) : null
            ));
        }

        return fn(value as T, index);
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
            throw new Error(`Missing required parameter ${String(field)}`);
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

/**
 * This was created for validating the accepts
*/
export function getFieldTypesFromFieldConfigAndChildConfig(
    config: Readonly<DataTypeFieldConfig>,
    childConfig: DataTypeFields | ReadonlyDataTypeFields | undefined
): readonly FieldType[] {
    if (config.type !== FieldType.Tuple || !childConfig) {
        return [config.type as FieldType];
    }

    return Object.values(childConfig).map((c) => c.type as FieldType);
}

export function validateAccepts(
    accepts: readonly FieldType[], types: readonly FieldType[]
): Error | undefined {
    if (!accepts?.length || !types.length) return;

    function isAccepted(type: FieldType): boolean {
        if (type === FieldType.Any) return true;
        if (numericTypes.has(type) && accepts.includes(FieldType.Number)) {
            return true;
        }
        if (stringTypes.has(type) && accepts.includes(FieldType.String)) {
            return true;
        }
        return accepts.includes(type);
    }

    if (types.every(isAccepted)) return;

    return new Error(`Incompatible with field type ${joinList(types)}, must be ${joinList(accepts)}`);
}
