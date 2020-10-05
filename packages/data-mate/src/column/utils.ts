import { v4 as uuid } from 'uuid';
import { joinList, toString } from '@terascope/utils';
import {
    DataTypeFieldConfig, DataTypeFields, Maybe
} from '@terascope/types';
import { Builder } from '../builder';
import {
    Vector, isVector, VectorType
} from '../vector';
import { ColumnTransformFn, TransformMode } from './interfaces';
import { ReadableData, WritableData } from '../data';

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
        { ...vector.config, ...config, ...transform.output },
        WritableData.make(vector.size),
        vector.childConfig
    );

    if (transform.mode === TransformMode.NONE) {
        return mapVectorNone(vector, builder);
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

export function mapVectorNone<T, R = T>(
    vector: Vector<T>,
    builder: Builder<R>,
): Vector<R> {
    for (const { value, indices } of vector.data.values) {
        builder.mset(value, indices);
    }
    return builder.toVector();
}

export function mapVectorEach<T, R = T>(
    vector: Vector<T>,
    builder: Builder<R>,
    fn: (value: Maybe<T|Vector<T>>) => Maybe<R|Vector<R>>,
): Vector<R> {
    for (const { value, indices } of vector.data.values) {
        builder.mset(fn(value), indices);
    }
    return builder.toVector();
}

export function mapVectorEachValue<T, R = T>(
    vector: Vector<T>,
    builder: Builder<R>,
    fn: (value: T) => Maybe<R>,
): Vector<R> {
    for (const { value, indices } of vector.data.values) {
        if (isVector<T>(value)) {
            const values: Maybe<R>[] = [];
            for (const val of value) {
                values.push(val == null ? fn(val as any) : null);
            }
            builder.mset(values, indices);
        } else {
            builder.mset(
                fn(value),
                indices,
            );
        }
    }
    return builder.toVector();
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

        const builder = Builder.make(config, WritableData.make(0));
        if (builder.valueFrom && result[field] != null) {
            result[field] = builder.valueFrom(result[field], builder) as any;
        }
    }

    return result;
}

const emptyData = new ReadableData<any>(WritableData.make(0));

export function validateFieldTransformType(
    accepts: VectorType[], vector: Vector<any>
): void {
    if (!accepts?.length) return;
    // if the type is a List, then we need to give the child type
    const type = vector.type === VectorType.List ? Vector.make({
        ...vector.config,
        array: false,
    }, emptyData).type : vector.type;

    if (!accepts.includes(type)) {
        throw new Error(`Incompatible with field type ${type}, must be ${joinList(accepts)}`);
    }
}
