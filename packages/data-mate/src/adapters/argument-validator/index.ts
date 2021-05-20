import {
    isNil,
    isString,
    isNumber,
    isBoolean,
    isValidDate,
    isGeoJSON,
    isGeoPoint,
    isObjectEntity,
    isIP,
    joinList, getTypeOf, isEmpty, isBigInt,
    isArray,
    isFloat,
} from '@terascope/utils';
import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import {
    FunctionDefinitionConfig,
} from '../../function-configs/interfaces';

// TODO: migrate IPRange to IP?
function getType(
    argFieldType: DataTypeFieldConfig,
): (input: unknown) => boolean {
    switch (argFieldType.type) {
        case FieldType.String:
        case FieldType.Text:
        case FieldType.Keyword:
        case FieldType.KeywordCaseInsensitive:
        case FieldType.KeywordTokens:
        case FieldType.KeywordTokensCaseInsensitive:
        case FieldType.KeywordPathAnalyzer:
        case FieldType.Domain:
        case FieldType.Hostname:
        case FieldType.NgramTokens:
            return isString;
        case FieldType.IP:
            return isIP;
        case FieldType.IPRange:
            return isIP;
        case FieldType.Date:
            return isValidDate;
        case FieldType.Boolean:
            return isBoolean;
        case FieldType.Float:
        case FieldType.Number:
            return isFloat;
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return isNumber;
        case FieldType.Long:
        case FieldType.Double:
            return isBigInt;
        case FieldType.Geo:
        case FieldType.GeoPoint:
        case FieldType.Boundary:
            return isGeoPoint;
        case FieldType.GeoJSON:
            return isGeoJSON;
        case FieldType.Object:
            return isObjectEntity;
        case FieldType.Tuple:
            return isArray;
        default:
            // equivalent to an any-builder
            return () => true;
    }
}

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
                const typeValidator = getType(typeConfig);
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
