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
import { Data } from '../core-utils';

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
        vector.size,
        vector.childConfig
    );

    if (transform.mode === TransformMode.NONE) {
        for (const val of vector.associations()) {
            builder.mset(val[0], val[1]);
        }
        return builder.toVector();
    }

    if (transform.mode === TransformMode.EACH) {
        for (const val of vector.associations()) {
            builder.mset(val[0], transform.fn(val[1]));
        }
        return builder.toVector();
    }

    if (transform.mode === TransformMode.EACH_VALUE) {
        for (const [indices, value] of vector.associations()) {
            if (transform.skipNulls !== false && value == null) {
                builder.mset(indices, null);
            } else if (isVector<T>(value)) {
                const values: Maybe<R>[] = [];
                for (const val of value) {
                    if (transform.skipNulls !== false && val == null) {
                        values.push(null);
                    } else {
                        values.push(
                            transform.fn(val as any)
                        );
                    }
                }
                builder.mset(indices, values);
            } else {
                builder.mset(
                    indices,
                    transform.fn(value as any)
                );
            }
        }
        return builder.toVector();
    }

    throw new Error(`Unknown transformation ${toString(transform)}`);
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

        const builder = Builder.make(config);
        if (builder.valueFrom && result[field] != null) {
            result[field] = builder.valueFrom(result[field], builder) as any;
        }
    }

    return result;
}

const emptyData = new Data<any>(0).freeze();

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
