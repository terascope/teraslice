import { v4 as uuid } from 'uuid';
import { toString } from '@terascope/utils';
import {
    DataTypeFieldConfig, Maybe
} from '@terascope/types';
import { Builder } from '../builder';
import {
    Vector, isVector
} from '../vector';
import { ColumnTransformFn, TransformMode } from './interfaces';

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
        for (let i = 0; i < vector.size; i++) {
            const value = vector.get(i) as Maybe<T|Vector<T>>;
            builder.append(value);
        }
        return builder.toVector();
    }

    if (transform.mode === TransformMode.EACH) {
        for (let i = 0; i < vector.size; i++) {
            const value = vector.get(i) as Maybe<T|Vector<T>>;
            builder.append(transform.fn(value));
        }
        return builder.toVector();
    }

    if (transform.mode === TransformMode.EACH_VALUE) {
        for (let i = 0; i < vector.size; i++) {
            const value = vector.get(i) as Maybe<T|Vector<T>>;
            if (transform.skipNulls !== false && value == null) {
                builder.append(null);
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
                builder.append(values);
            } else {
                builder.append(
                    transform.fn(value as any)
                );
            }
        }
        return builder.toVector();
    }

    throw new Error(`Unknown transformation ${toString(transform)}`);
}

export function isSameFieldConfig(
    a: Readonly<DataTypeFieldConfig>, b: Readonly<DataTypeFieldConfig>
): boolean {
    if (a.type !== b.type) return false;

    const aArray = a.array ?? false;
    const bArray = a.array ?? false;
    if (aArray !== bArray) return false;

    if (a.format !== b.format) return false;

    if (a.locale !== b.locale) return false;

    return true;
}
