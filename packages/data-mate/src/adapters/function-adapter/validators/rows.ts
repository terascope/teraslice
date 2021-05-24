import { isObjectEntity, cloneDeep } from '@terascope/utils';
import { RecordValidationConfig, InitialFunctionContext } from '../../../function-configs/interfaces';

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

        const fn = fnDef.create({
            ...configs,
            parent: input
        });

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
