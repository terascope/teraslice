import { isObjectEntity, cloneDeep, isFunction } from '@terascope/core-utils';
import { validateFunctionArgs } from '../../argument-validator/index.js';
import { RecordValidationConfig, InitialFunctionContext, FunctionContext } from '../../../function-configs/interfaces.js';

export function recordValidationExecution<
    T extends Record<string, any>,
    K extends Record<string, any> = Record<string, unknown>
>(
    fnDef: RecordValidationConfig<K>,
    configs: InitialFunctionContext<K>,
) {
    return function _row(
        input: T[],
    ): Record<string, unknown>[] {
        if (!Array.isArray(input)) {
            throw new Error('Invalid input, expected an array of objects');
        }

        const results: T[] = [];

        if (isFunction(configs.args)) {
            for (let i = 0; i < input.length; i++) {
                const clone = cloneDeep(input[i]);

                if (!isObjectEntity(clone)) {
                    throw new Error(`Invalid record ${JSON.stringify(clone)}, expected an array of simple objects or data-entities`);
                }

                const newArgs = configs.args(i) as K;
                validateFunctionArgs(fnDef, newArgs);

                const fnConfig: FunctionContext<K> = {
                    ...configs,
                    args: newArgs as K,
                    parent: input
                };

                const fn = fnDef.create(fnConfig);

                // TODO: how much error handling should be here vs the function
                if (fn(clone, i)) {
                    results.push(clone);
                }
            }
        }

        const fnConfig: FunctionContext<K> = {
            ...configs,
            args: configs.args as K,
            parent: input
        };

        const fn = fnDef.create(fnConfig);

        for (let i = 0; i < input.length; i++) {
            const clone = cloneDeep(input[i]);

            if (!isObjectEntity(clone)) {
                throw new Error(`Invalid record ${JSON.stringify(clone)}, expected an array of simple objects or data-entities`);
            }

            // TODO: how much error handling should be here vs the function
            if (fn(clone, i)) {
                results.push(clone);
            }
        }

        return results;
    };
}
