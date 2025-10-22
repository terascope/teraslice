import {
    isObjectEntity, get, set, cloneDeep,
    isNil, unset, isFunction
} from '@terascope/core-utils';
import { FieldTransformConfig, InitialFunctionContext, FunctionContext } from '../../../../function-configs/interfaces.js';
import { DynamicFunctionAdapterContext, FunctionAdapterContext } from '../../interfaces.js';
import { validateFunctionArgs } from '../../../argument-validator/index.js';

export function wholeFieldTransformRowExecution<
    T extends Record<string, any> = Record<string, unknown>
>(
    fnDef: FieldTransformConfig<T>,
    configs: InitialFunctionContext<T>,
): (input: Record<string, unknown>[]) => Record<string, unknown>[] {
    return function _wholeFieldTransformRowExecution(
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

            return _wholeFieldTransformRowDynamic<T>(fnDef, dynamicContext);
        }

        const functionContext: FunctionAdapterContext<T> = {
            ...configs,
            args: configs.args as T,
            parent: input
        };

        return _wholeFieldTransformRow(fnDef, functionContext);
    };
}

function _wholeFieldTransformRow<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    configs: FunctionAdapterContext<T>
) {
    const results: Record<string, unknown>[] = [];
    const fn = fnDef.create(configs);
    const input = configs.parent as Record<string, unknown>[];

    for (let i = 0; i < input.length; i++) {
        const clone = cloneDeep(input[i]) as Record<string, unknown>;

        if (!isObjectEntity(clone)) {
            throw new Error(`Invalid record ${JSON.stringify(clone)}, expected an array of simple objects or data-entities`);
        }

        _processWholeFieldTransform(
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

function _wholeFieldTransformRowDynamic<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    configs: DynamicFunctionAdapterContext<T>,
) {
    const results: Record<string, unknown>[] = [];
    const input = configs.parent as Record<string, unknown>[];

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

        _processWholeFieldTransform(
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

function _processWholeFieldTransform(
    fn: (input: unknown, index: number) => unknown,
    clone: Record<string, unknown>,
    field: string,
    preserveEmptyObjects: boolean,
    preserveNulls: boolean,
    i: number,
    results: unknown[],
) {
    const value = get(clone, field);
    const data = fn(value, i);

    if (isNil(data)) {
        if (preserveNulls) {
            set(clone, field, null);
        } else {
            unset(clone, field);
        }
    } else {
        set(clone, field, data);
    }

    if (preserveEmptyObjects) {
        results.push(clone);
    } else {
        const hasKeys = Object.keys(clone).length !== 0;

        if (hasKeys) {
            results.push(clone);
        }
    }
}
