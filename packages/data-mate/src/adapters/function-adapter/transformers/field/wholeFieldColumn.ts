import { isNil, isFunction } from '@terascope/core-utils';
import { FieldTransformConfig, InitialFunctionContext, FunctionContext } from '../../../../function-configs/interfaces.js';
import { DynamicFunctionAdapterContext, FunctionAdapterContext } from '../../interfaces.js';
import { validateFunctionArgs } from '../../../argument-validator/index.js';

export function wholeFieldTransformColumnExecution<
    T extends Record<string, any> = Record<string, unknown>
>(
    fnDef: FieldTransformConfig<T>,
    configs: InitialFunctionContext<T>,
) {
    return function _wholeFieldTransformColumnExecution(
        input: unknown[],
    ): unknown[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of values');
        }

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
                const newValue = fn(value, index);

                if (!isNil(newValue)) {
                    results.push(newValue);
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
            const newValue = fn(value, index);

            if (!isNil(newValue)) {
                results.push(newValue);
            } else if (configs.preserveNulls) {
                results.push(null);
            }
        });

        return results;
    };
}
