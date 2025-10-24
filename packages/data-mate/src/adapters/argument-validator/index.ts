import {
    isNil, isNumber, isBoolean,
    joinList, set, isEmpty,
} from '@terascope/core-utils';
import { coerceToType } from '../../builder/type-coercion.js';
import { getDataTypeFieldAndChildren } from '../utils.js';
import { FunctionDefinitionConfig, DataTypeFieldAndChildren } from '../../function-configs/interfaces.js';

function isEmptyLike(input: unknown): boolean {
    // if it nil, or [], {}, booleans are fine
    return isNil(input) || (!isBoolean(input) && !isNumber(input) && isEmpty(input));
}

export function validateFunctionArgs<T extends Record<string, any>>(
    fnDef: FunctionDefinitionConfig<T>,
    fnArgs = {} as T
): T {
    let args = fnArgs;

    // check required fields
    if (fnDef?.required_arguments?.length) {
        if (!Object.keys(args).length) {
            throw new Error(`No arguments were provided but ${fnDef.name} requires ${joinList(
                fnDef.required_arguments as string[]
            )} to be set`);
        }

        for (const field of fnDef.required_arguments) {
            if (!Object.hasOwnProperty.call(args, field) || isEmptyLike(args[field])) {
                throw new Error(`Invalid arguments, requires ${field} to be set to a non-empty value`);
            }
        }
    }

    // check fields are right type;
    if (fnDef.argument_schema) {
        let newArgs = {} as Partial<T>;

        for (const field of Object.keys(fnDef.argument_schema)) {
            if (Object.hasOwnProperty.call(args, field)) {
                const { field_config, child_config } = getDataTypeFieldAndChildren(
                    { fields: fnDef.argument_schema },
                    field,
                ) as DataTypeFieldAndChildren;
                const coerceValue = coerceToType(field_config, child_config);

                newArgs = set(newArgs, field, coerceValue(args[field]));
            }
        }

        args = newArgs as T;
    }

    if (fnDef.validate_arguments) {
        fnDef.validate_arguments(args ?? ({} as T));
    }

    return args;
}
