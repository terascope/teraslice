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
    joinList, getTypeOf, isEmpty
} from '@terascope/utils';
import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import { forEach } from 'lodash';
import {
    FunctionDefinitions,
} from '../../interfaces';

// TODO: what about bigint?
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
        case FieldType.Double:
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
        case FieldType.Long:
            return isNumber;
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return isGeoPoint;
        case FieldType.GeoJSON:
            return isGeoJSON;
        case FieldType.Object:
            return isObjectEntity;
        case FieldType.Tuple:
            return isNumberTuple;
        default:
            // equivalent to an any-builder
            return () => true;
    }
}

function isNumberTuple(input: unknown): boolean {
    return Array.isArray(input) && input.length === 2;
}

function isEmptyLike(input: unknown): boolean {
    // if it nil, or [], {}, booleans are fine
    return isNil(input) || (!isBoolean(input) && isEmpty(input));
}

export function validateFunctionArgs(fnDef: FunctionDefinitions, args?: Record<string, any>): void {
    // check required fields
    if (fnDef?.required_arguments?.length) {
        if (isNil(args)) {
            throw new Error(`No arguments were provided but ${fnDef.name} requires ${joinList(fnDef.required_arguments)} to be set`);
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
            if (Object.hasOwnProperty.call(args, field)) {
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
        fnDef.validate_arguments(args ?? {});
    }
}
