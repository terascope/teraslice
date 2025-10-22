import { isNotNil, isFunction } from '@terascope/core-utils';
import {
    FieldValidateConfig, InitialFunctionContext, FunctionContext,
} from '../../../../function-configs/interfaces.js';
import { callValue } from '../../utils.js';
import { validateFunctionArgs } from '../../../argument-validator/index.js';
import { FunctionAdapterContext, DynamicFunctionAdapterContext } from '../../interfaces.js';

export function fieldValidationColumnExecution<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    configs: InitialFunctionContext<T>,
) {
    return function _fieldValidationColumnExecution(
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

            return _fieldValidationDynamic<T>(fnDef, dynamicContext);
        }

        const functionContext: FunctionAdapterContext<T> = {
            ...configs,
            args: configs.args as T,
            parent: input
        };

        return _fieldValidation<T>(fnDef, functionContext);
    };
}

function _fieldValidationDynamic<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
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

        _processValidationValue(fn, value, results, configs.preserveNulls, i);
    }

    return results;
}

function _fieldValidation<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    configs: FunctionAdapterContext<T>,
) {
    const fn = fnDef.create(configs);
    const input = configs.parent as unknown[];

    const results: (unknown | null)[] = [];

    for (let i = 0; i < input.length; i++) {
        const value = input[i];
        _processValidationValue(fn, value, results, configs.preserveNulls, i);
    }

    return results;
}

function _processValidationValue(
    fn: (input: unknown, index: number) => unknown,
    value: unknown,
    results: unknown[],
    preserveNulls: boolean,
    i: number
) {
    if (Array.isArray(value)) {
        const fieldList = callValue(fn, value, preserveNulls, true, i);

        if (fieldList.length > 0) {
            results.push(fieldList);
        } else if (preserveNulls) {
            results.push(null);
        }
    } else if (isNotNil(value) && fn(value, i)) {
        results.push(...callValue(fn, value, preserveNulls, true, i));
    } else if (preserveNulls) {
        results.push(null);
    }
}
