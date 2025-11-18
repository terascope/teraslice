import { isFunction } from '@terascope/core-utils';
import {
    FieldValidateConfig, InitialFunctionContext, FunctionContext,
} from '../../../../function-configs/interfaces.js';
import { validateFunctionArgs } from '../../../argument-validator/index.js';
import { FunctionAdapterContext, DynamicFunctionAdapterContext } from '../../interfaces.js';

export function wholeFieldValidationColumnExecution<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    configs: InitialFunctionContext<T>,
) {
    return function _fieldValidationColumnExecution(
        input: unknown[],
    ): unknown[] {
        const results: unknown[] = [];

        if (isFunction(configs.args)) {
            const dynamicContext = {
                ...configs,
                parent: input,
            } as DynamicFunctionAdapterContext<T>;

            input.forEach((value: unknown, index: number) => {
                const newArgs = dynamicContext.args(index) as T;
                validateFunctionArgs(fnDef, newArgs);

                const fnConfig: FunctionContext<T> = {
                    ...dynamicContext,
                    args: newArgs as T,
                };

                const fn = fnDef.create(fnConfig);
                const bool = fn(value, index);

                if (bool) {
                    results.push(value);
                } else if (configs.preserveNulls) {
                    results.push(null);
                }
            });

            return results;
        }

        const functionContext: FunctionAdapterContext<T> = {
            ...configs,
            args: configs.args as T,
            parent: input
        };

        const fn = fnDef.create(functionContext);

        input.forEach((value: unknown, index: number) => {
            const bool = fn(value, index);
            if (bool) {
                results.push(value);
            } else if (configs.preserveNulls) {
                results.push(null);
            }
        });

        return results;
    };
}
