import { getTypeOf, TSError } from '@terascope/core-utils';
import {
    DataTypeFields, FieldType, ReadonlyDataTypeFields,
    TypedArray, TypedArrayConstructor
} from '@terascope/types';
import {
    FieldArg, MAX_16BIT_INT, MAX_32BIT_INT,
    MAX_8BIT_INT,
} from './interfaces.js';

export function getFieldsFromArg<
    K extends(number | string | symbol)
>(fields: readonly K[], arg: FieldArg<K>[]): ReadonlySet<K> {
    if (!Array.isArray(arg)) {
        throw new Error(`Expected field arg to be an array, got ${arg} (${getTypeOf(arg)})`);
    }

    const result = flattenStringArg(arg);

    for (const field of result) {
        if (!fields.includes(field)) {
            throw new TSError(`Unknown field ${String(field)}`, {
                statusCode: 400
            });
        }
    }

    return result;
}

export function flattenStringArg<
    K extends(number | string | symbol)
>(arg: FieldArg<K>[]): ReadonlySet<K> {
    if (!Array.isArray(arg)) {
        throw new Error(`Expected field arg to an array, got ${arg} (${getTypeOf(arg)})`);
    }

    const result = new Set<K>();

    for (const fieldArg of arg) {
        if (Array.isArray(fieldArg)) {
            fieldArg.forEach((field) => result.add(field));
        } else {
            result.add(fieldArg as K);
        }
    }

    if (!result.size) {
        throw new TSError('Expected at least one field', {
            statusCode: 400
        });
    }

    return result;
}

/**
 * Gets the correctly sized TypeArray depending on the length of items
 */
export function getPointerArray(size: number): TypedArray {
    const PointerArray = getTypedArrayClass(size);
    return new PointerArray(size);
}

/**
 * Gets the correctly sized TypeArray constructor depending on the size of values being stored
 */
export function getTypedArrayClass(size: number): TypedArrayConstructor {
    const maxIndex = size - 1;

    if (maxIndex <= MAX_8BIT_INT) return Uint8Array;

    if (maxIndex <= MAX_16BIT_INT) return Uint16Array;

    if (maxIndex <= MAX_32BIT_INT) return Uint32Array;

    return Float64Array;
}

export function freezeObject<T extends Record<string, any>>(
    input: T
): T extends Readonly<infer U> ? Readonly<U> : Readonly<T> {
    if (Object.isFrozen(input)) return input as any;
    return Object.freeze({ ...input }) as any;
}

type ArrLike = (any[])|(readonly any[]);
export function freezeArray<T extends ArrLike>(
    input: T
): T extends Readonly<infer U> ? Readonly<U> : Readonly<T> {
    if (Object.isFrozen(input)) return input as any;
    return Object.freeze(input.slice()) as any;
}

/**
 * This is used in the Vector and Builder classes
 * to get the correctly scoped field configurations
 * since we use dot notation for nested field configurations
*/
export function getChildDataTypeConfig(
    config: DataTypeFields | ReadonlyDataTypeFields,
    baseField: string,
    fieldType: FieldType
): DataTypeFields | undefined {
    // Tuples are configured like objects except the nested field names
    // are the positional indexes in the tuple
    if (fieldType !== FieldType.Object && fieldType !== FieldType.Tuple) return;

    const childConfig: DataTypeFields = {};
    for (const [field, fieldConfig] of Object.entries(config)) {
        const withoutBase = field.replace(`${baseField}.`, '');
        if (withoutBase !== field) {
            childConfig[withoutBase] = fieldConfig;
        }
    }
    return childConfig;
}
