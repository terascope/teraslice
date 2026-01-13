import {
    isObjectEntity, get, set, cloneDeep,
    isNil, unset, isFunction
} from '@terascope/core-utils';
import {
    FieldValidateConfig, InitialFunctionContext, FunctionContext,
} from '../../../../function-configs/interfaces.js';
import { validateFunctionArgs } from '../../../argument-validator/index.js';
import { FunctionAdapterContext, DynamicFunctionAdapterContext } from '../../interfaces.js';

export function wholeFieldValidationRowExecution<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    configs: InitialFunctionContext<T>,
): (input: Record<string, unknown>[]) => Record<string, unknown>[] {
    return function _wholeFieldValidationRowExecution(
        input: Record<string, unknown>[],
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

            return _wholeFieldValidationRowDynamic<T>(fnDef, dynamicContext);
        }

        const functionContext: FunctionAdapterContext<T> = {
            ...configs,
            args: configs.args as T,
            parent: input
        };

        return _wholeFieldValidationRow(fnDef, functionContext);
    };
}

function _wholeFieldValidationRow<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
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

        _processWholeFieldValidationRow(
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

function _wholeFieldValidationRowDynamic<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
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

        _processWholeFieldValidationRow(
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

function _processWholeFieldValidationRow(
    fn: (input: unknown, index: number) => unknown,
    clone: Record<string, unknown>,
    field: string,
    preserveEmptyObjects: boolean,
    preserveNulls: boolean,
    i: number,
    results: unknown[],
) {
    const value = get(clone, field);
    const isValid = fn(value, i);
    // if it fails validation and we keep null
    if (!isValid && preserveNulls) {
        set(clone, field, null);
        results.push(clone);
    } else if (!isValid) {
        // remove key, check if empty record
        unset(clone, field);
        // if we preserve empty objects, we don't need to check anything
        if (preserveEmptyObjects) {
            results.push(clone);
        } else {
            const hasKeys = Object.keys(clone).length !== 0;
            if (hasKeys) {
                results.push(clone);
            }
        }
    } else {
        results.push(clone);
    }
}
