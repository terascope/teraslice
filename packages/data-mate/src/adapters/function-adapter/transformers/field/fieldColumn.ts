import { isNotNil, isFunction } from '@terascope/core-utils';
import { FieldTransformConfig, InitialFunctionContext, FunctionContext } from '../../../../function-configs/interfaces.js';
import { callValue } from '../../utils.js';
import { DynamicFunctionAdapterContext, FunctionAdapterContext } from '../../interfaces.js';
import { validateFunctionArgs } from '../../../argument-validator/index.js';

export function fieldTransformColumnExecution<
    T extends Record<string, any> = Record<string, unknown>
>(
    fnDef: FieldTransformConfig<T>,
    configs: InitialFunctionContext<T>,
) {
    return function _fieldTransformColumnExecution(
        input: unknown[],
    ): (unknown | null)[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }

        if (isFunction(configs.args)) {
            const dynamicContext = {
                ...configs,
                parent: input,
            } as DynamicFunctionAdapterContext<T>;

            return _processesTransformDynamic<T>(fnDef, dynamicContext);
        }

        const functionContext: FunctionAdapterContext<T> = {
            ...configs,
            args: configs.args as T,
            parent: input
        };

        return _processesTransform<T>(fnDef, functionContext);
    };
}

function _processesTransform<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    configs: FunctionAdapterContext<T>,
) {
    const fn = fnDef.create(configs);
    const input = configs.parent as unknown[];

    const results: (unknown | null)[] = [];

    for (let i = 0; i < input.length; i++) {
        const value = input[i];
        _processFieldTransform(fn, value, configs.preserveNulls, i, results);
    }

    return results;
}

function _processesTransformDynamic<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    configs: DynamicFunctionAdapterContext<T>,
) {
    const results: (unknown | null)[] = [];
    const input = configs.parent;

    for (let i = 0; i < input.length; i++) {
        const newArgs = configs.args(i) as T;
        validateFunctionArgs(fnDef, newArgs);

        const fnConfig: FunctionContext<T> = {
            ...configs,
            args: newArgs as T,
        };

        const fn = fnDef.create(fnConfig);
        const value = input[i];

        _processFieldTransform(fn, value, configs.preserveNulls, i, results);
    }

    return results;
}

function _processFieldTransform(
    fn: (input: unknown, index: number) => unknown,
    value: unknown,
    preserveNulls: boolean,
    i: number,
    results: unknown[]
) {
    if (isNotNil(value)) {
        if (Array.isArray(value)) {
            const fieldList = callValue(fn, value, preserveNulls, false, i);

            if (fieldList.length > 0) {
                results.push(fieldList);
            } else if (preserveNulls) {
                results.push(null);
            }
        } else {
            const newValue = callValue(fn, value, preserveNulls, false, i);
            results.push(...newValue);
        }
    } else if (preserveNulls) {
        results.push(null);
    }
}
