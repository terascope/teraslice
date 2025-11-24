import {
    isObjectEntity, get, set, cloneDeep,
    isNil, unset, isFunction
} from '@terascope/core-utils';
import { FieldTransformConfig, InitialFunctionContext, FunctionContext } from '../../../../function-configs/interfaces.js';
import { callValue } from '../../utils.js';
import { DynamicFunctionAdapterContext, FunctionAdapterContext } from '../../interfaces.js';
import { validateFunctionArgs } from '../../../argument-validator/index.js';

export function fieldTransformRowExecution<
    T extends Record<string, any> = Record<string, unknown>
>(
    fnDef: FieldTransformConfig<T>,
    configs: InitialFunctionContext<T>,
): (input: Record<string, unknown>[]) => Record<string, unknown>[] {
    return function _fieldTransformRowExecution(
        input: Record<string, unknown>[]
    ): Record<string, unknown>[] {
        if (isNil(configs.field)) throw new Error('Must provide a field option when running a row');

        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        if (isFunction(configs.args)) {
            const dynamicContext = {
                ...configs,
                parent: input,
            } as DynamicFunctionAdapterContext<T>;

            return _fieldTransformRowDynamic<T>(fnDef, dynamicContext);
        }

        const functionContext: FunctionAdapterContext<T> = {
            ...configs,
            args: configs.args as T,
            parent: input
        };

        return _fieldTransformRow<T>(fnDef, functionContext);
    };
}

function _fieldTransformRowDynamic<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    configs: DynamicFunctionAdapterContext<T>
) {
    const input = configs.parent as unknown[];
    const results: T[] = [];

    for (let i = 0; i < input.length; i++) {
        const clone = cloneDeep(input[i]) as Record<string, unknown>;

        if (!isObjectEntity(clone)) {
            throw new Error(`Invalid record ${JSON.stringify(clone)}, expected an array of simple objects or data-entities`);
        }

        const newArgs = configs.args(i) as T;
        validateFunctionArgs(fnDef, newArgs);

        const fnConfig: FunctionContext<T> = {
            ...configs,
            args: newArgs as T,
        };

        const fn = fnDef.create(fnConfig);

        _processFieldTransformRow(
            fn,
            clone,
            configs.field as string,
            configs.preserveEmptyObjects,
            configs.preserveNulls,
            i,
            results
        );
    }

    return results;
}

function _fieldTransformRow<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    configs: FunctionAdapterContext<T>
) {
    const fn = fnDef.create(configs);
    const input = configs.parent as unknown[];

    const results: T[] = [];

    for (let i = 0; i < input.length; i++) {
        const clone = cloneDeep(input[i]) as Record<string, unknown>;

        if (!isObjectEntity(clone)) {
            throw new Error(`Invalid record ${JSON.stringify(clone)}, expected an array of simple objects or data-entities`);
        }

        _processFieldTransformRow(
            fn,
            clone,
            configs.field as string,
            configs.preserveEmptyObjects,
            configs.preserveNulls,
            i,
            results
        );
    }

    return results;
}

function _processFieldTransformRow(
    fn: (input: unknown, index: number) => unknown,
    clone: Record<string, unknown>,
    field: string,
    preserveEmptyObjects: boolean,
    preserveNulls: boolean,
    i: number,
    results: unknown[],
) {
    const value: unknown = get(clone, field);

    if (Array.isArray(value)) {
        const fieldList = callValue(fn, value, preserveNulls, false, i);

        // we have results in list or we don't care if its an empty list here
        if (fieldList.length > 0) {
            set(clone, field, fieldList);
            results.push(clone);
        } else {
            unset(clone, field);

            if (preserveEmptyObjects) {
                results.push(clone);
            } else {
                const hasKeys = Object.keys(clone).length !== 0;
                if (hasKeys) {
                    results.push(clone);
                }
            }
        }
    } else {
        let data: unknown = null;

        if (!isNil(value)) {
            data = fn(value, i);
        }

        if (isNil(data)) {
            if (preserveNulls) {
                set(clone, field, null);
            } else {
                unset(clone, field);
            }

            if (preserveEmptyObjects) {
                results.push(clone);
            } else {
                const hasKeys = Object.keys(clone).length !== 0;

                if (hasKeys) {
                    results.push(clone);
                }
            }
        } else {
            set(clone, field, data);
            results.push(clone);
        }
    }
}
