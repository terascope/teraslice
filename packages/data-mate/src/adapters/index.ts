import { isObjectEntity } from '@terascope/utils';
import { DataTypeFieldConfig } from '@terascope/types';
import { FieldFunctionDefinitions, FieldValidateConfig } from '../interfaces';

type FieldFunctionInput = unknown | Record<string, unknown> | Record<string, unknown>[]

export function fieldFunctionAdapter(
    fnDef: FieldValidateConfig,
    field: string,
    args?: Record<string, unknown>
): (input: Record<string, unknown>[]) => boolean[]
export function fieldFunctionAdapter(
    fnDef: FieldValidateConfig,
    field: string,
    args?: Record<string, unknown>
): (input: Record<string, unknown>) => boolean
export function fieldFunctionAdapter(
    /** The field validation or transform function definition */
    fnDef: FieldFunctionDefinitions,
    field: string,
    args: Record<string, unknown> = {},
    _inputConfig?: DataTypeFieldConfig
): any {
    const fn = fnDef.create(args);
    // call validateArgs

    return function _fn(input: FieldFunctionInput) {
        if (Array.isArray(input)) {
            const results = [];
            for (const obj of input) {
                results.push(fn(obj[field]));
            }
            return results;
        }

        if (isObjectLike(input)) {
            return fn(input[field]);
        }

        return fn(input);
    };
}

function isObjectLike(input: unknown): input is Record<string, unknown> {
    return isObjectEntity(input);
}

/*
(input: Record<string, unknown>[]) => {
    // call validateArgs
    //
}
*/
// export function dataFrameAdapter(fnDef: FunctionDefinition,
//     field: string,
//     args?: Record<string, unknown>) {

// }
