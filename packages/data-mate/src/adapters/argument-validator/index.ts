import {
    isNil, isNumber, isBoolean, getValidatorForFieldType,
    joinList, getTypeOf, isEmpty,
} from '@terascope/utils';
import {
    FunctionDefinitionConfig,
} from '../../function-configs/interfaces';

function isEmptyLike(input: unknown): boolean {
    // if it nil, or [], {}, booleans are fine
    return isNil(input) || (!isBoolean(input) && !isNumber(input) && isEmpty(input));
}

export function validateFunctionArgs<T extends Record<string, any>>(
    fnDef: FunctionDefinitionConfig<T>,
    args?: T
): asserts args is T {
    // check required fields
    if (fnDef?.required_arguments?.length) {
        if (isNil(args) || !Object.keys(args).length) {
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
        const config = args ?? {};

        for (const [field, typeConfig] of Object.entries(fnDef.argument_schema)) {
            if (Object.hasOwnProperty.call(config, field)) {
                const typeValidator = getValidatorForFieldType(typeConfig);
                // if its an array of values, check each one
                if (typeConfig.array) {
                    if (!config[field].every(typeValidator)) {
                        throw new Error(`Invalid argument value set at key ${field}, expected ${config[field]} to be compatible with type ${typeConfig.type}[]`);
                    }
                } else if (!typeValidator(config[field])) {
                    throw new Error(`Invalid argument value set at key ${field}, expected ${getTypeOf(config[field])} to be compatible with type ${typeConfig.type}`);
                }
            }
        }
    }

    if (fnDef.validate_arguments) {
        fnDef.validate_arguments(args ?? ({} as T));
    }
}
