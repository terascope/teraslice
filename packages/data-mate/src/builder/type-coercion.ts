import {
    DataTypeFieldConfig, FieldType,
    DataTypeFields, ReadonlyDataTypeFields,
    GeoPoint, GeoBoundary
} from '@terascope/types';
import { createHash } from 'node:crypto';
import {
    primitiveToString, toString, toBooleanOrThrow,
    isValidateNumberType, toBigIntOrThrow, toNumberOrThrow,
    toIntegerOrThrow, toFloatOrThrow, hasOwn, isKey,
    isArrayLike, castArray, getTypeOf, isPlainObject,
    noop, isNotNil, isIterator
} from '@terascope/core-utils';
import { isIPRangeOrThrow, isIPOrThrow } from '@terascope/ip-utils';
import { toEpochMSOrThrow } from '@terascope/date-utils';
import { toGeoJSONOrThrow, parseGeoPoint } from '@terascope/geo-utils';

type CoerceFN<T = unknown> = (input: unknown) => T;

/** Will return a function that will coerce the input values to the DataTypeFieldConfig provided.
 * The parameter childConfig is only necessary with Tuple or Object field types
 */
export function coerceToType<T = unknown>(
    fieldConfig: DataTypeFieldConfig,
    childConfig?: DataTypeFields
): CoerceFN<T> {
    if (fieldConfig.array) {
        const fn = getTransformerForFieldType<T>(fieldConfig, childConfig);
        return callIfNotNil(coerceToArrayType<T>(fn));
    }

    return getTransformerForFieldType<T>(fieldConfig, childConfig) as CoerceFN<T>;
}

function coerceToArrayType<T = unknown>(
    fn: CoerceFN<T>,
): CoerceFN<T> {
    return function _coerceToArrayType(inputs: unknown): T {
        return castArray(inputs).map(fn) as unknown as T;
    };
}

function _shouldCheckIntSize(type: FieldType) {
    if (type === FieldType.Integer) return true;
    if (type === FieldType.Short) return true;
    if (type === FieldType.Byte) return true;
    return false;
}

const NumberTypeFNDict = {
    [FieldType.Float]: toFloatOrThrow,
    [FieldType.Number]: toNumberOrThrow,
    [FieldType.Double]: toNumberOrThrow,
    [FieldType.Integer]: toIntegerOrThrow,
    [FieldType.Byte]: toIntegerOrThrow,
    [FieldType.Short]: toIntegerOrThrow,
    [FieldType.Long]: toBigIntOrThrow,
    [FieldType.Vector]: toFloatOrThrow,
};

export function coerceToNumberType(type: FieldType): (input: unknown) => number | bigint {
    const numberValidator = isValidateNumberType(type);
    const coerceFn = isKey(NumberTypeFNDict, type)
        ? NumberTypeFNDict[type]
        : null;
    const smallSize = _shouldCheckIntSize(type);

    if (coerceFn == null) {
        throw new Error(`Unsupported type ${type}, please provide a valid numerical field type`);
    }

    return function _coerceToNumberType(input: unknown): number | bigint {
        /**
         * We should keep these irrational numbers since they
         * useful for certain operations, however they will
         * be converted to null when converted to JavaScript
        */
        if (Number.isNaN(input)
            || input === Number.POSITIVE_INFINITY
            || input === Number.NEGATIVE_INFINITY) {
            return input as number;
        }

        const num = coerceFn(input);

        if (smallSize) {
            if (numberValidator(input)) return num;
            throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be a a valid ${type}`);
        }

        return num;
    };
}

/**
 * Convert value to a GeoPoint data type
*/
export function coerceToGeoPoint(input: unknown): GeoPoint {
    return parseGeoPoint(input, true);
}

/**
 * Convert value to a GeoBoundary data type, a GeoBoundary
 * is two GeoPoints, one representing the top left, the other representing
 * the bottom right
*/
export function coerceToGeoBoundary(input: unknown): GeoBoundary {
    if (!Array.isArray(input)) {
        throw new TypeError(`Geo Boundary requires an array, got ${input} (${getTypeOf(input)})`);
    }
    if (input.length !== 2) {
        throw new TypeError(`Geo Boundary requires two Geo Points, got ${input.length}`);
    }
    return [coerceToGeoPoint(input[0]), coerceToGeoPoint(input[1])];
}

function _mapToString(input: any): string {
    let hash = '';

    if (isIterator(input)) {
        for (const value of input) {
            hash += `,${_getHashCodeFrom(value)}`;
        }
    } else {
        for (const prop in input) {
            if (hasOwn(input, prop)) {
                hash += `,${prop}:${_getHashCodeFrom(input[prop])}`;
            }
        }
    }

    return hash;
}

function _getHashCodeFrom(value: unknown): string {
    if (value == null) return '';

    const typeOf = typeof value;
    return typeOf + (
        typeOf === 'object'
            ? _mapToString(value)
            : value
    );
}

/**
 * If we have a hash that is a long value we want to ensure that
 * the value doesn't explode the memory since we may be using
 * that value as a key. So when a string exceeds this specified
 * length we can reduce its length to 35 characters by using md5
*/
export const MAX_STRING_LENGTH_BEFORE_MD5 = 1024;

/**
 * Generate a unique hash code from a value, this is
 * not a guarantee but it is close enough for doing
 * groupBys and caching
*/
export function getHashCodeFrom(value: unknown): string {
    const hash = _getHashCodeFrom(value);
    if (hash.length > MAX_STRING_LENGTH_BEFORE_MD5) return `;${md5(hash)}`;
    return `:${hash}`;
}

export function md5(value: string | Buffer): string {
    return createHash('md5').update(value)
        .digest('hex');
}

function getChildDataTypeConfig(
    config: DataTypeFields | ReadonlyDataTypeFields,
    baseField: string,
    fieldType: FieldType
): DataTypeFields | undefined {
    // Tuples are configured like objects except the nested field names
    // are the positional indexes in the tuple
    if (fieldType !== FieldType.Object && fieldType !== FieldType.Tuple) return;

    const childConfig: DataTypeFields = {};
    for (const [field, fieldConfig] of Object.entries(config)) {
        const withoutBase = field.replace(`${baseField}.`, '');
        if (withoutBase !== field) {
            childConfig[withoutBase] = fieldConfig;
        }
    }
    return childConfig;
}

type ChildFields = readonly (
    [field: string, transformer: CoerceFN]
)[];

function formatObjectChildFields(childConfigs?: DataTypeFields) {
    if (!childConfigs) {
        return [];
    }

    const childFields: ChildFields = Object.entries(childConfigs)
        .map(([field, config]): [field: string, transformer: CoerceFN] | undefined => {
            const [base] = field.split('.', 1);
            if (base !== field && childConfigs![base]) return;

            const childConfig = getChildDataTypeConfig(
                childConfigs!, field, config.type as FieldType
            );

            return [field, coerceToType(config, childConfig)];
        })
        .filter(isNotNil) as ChildFields;

    return childFields;
}

function coerceToObject(fieldConfig: DataTypeFieldConfig, childConfig?: DataTypeFields) {
    const childFields = formatObjectChildFields(childConfig);

    return function _coerceToObject(input: unknown) {
        if (!isPlainObject(input)) {
            throw new TypeError(`Expected ${toString(input)} (${getTypeOf(input)}) to be an object`);
        }

        if (!childFields.length && !fieldConfig._allow_empty) {
            return { ...input as Record<string, unknown> };
        }

        const value = input as Readonly<Record<string, unknown>>;

        function _valueMap([field, transformer]: [field: string, transformer: CoerceFN]) {
            return [field, transformer(value[field])];
        }
        return Object.fromEntries(childFields.map(_valueMap));
    };
}

function formatTupleChildFields(childConfigs?: DataTypeFields): readonly CoerceFN[] {
    if (!childConfigs) {
        return [];
    }

    return Object.entries(childConfigs)
        .map(([field, config]) => {
            const childConfig = getChildDataTypeConfig(
                childConfigs!, field, config.type as FieldType
            );
            return coerceToType(config, childConfig);
        });
}

function coerceToTuple(_fieldConfig: DataTypeFieldConfig, childConfig?: DataTypeFields) {
    const childFields = formatTupleChildFields(childConfig);

    return function _coerceToTuple(input: unknown) {
        if (!isArrayLike(input)) {
            throw new TypeError(`Expected ${toString(input)} (${getTypeOf(input)}) to be an array`);
        }
        const len = childFields.length;
        if (input.length > len) {
            throw new TypeError(`Expected ${toString(input)} (${getTypeOf(input)}) to have a length of ${len}`);
        }

        return childFields.map((transformer, index) => transformer(input[index]));
    };
}

/**
 * This is a low level api, only coerceToType should reference this,
 * all other transforms should reference coerceToType as it handles arrays
*/
function getTransformerForFieldType<T = unknown>(
    argFieldType: DataTypeFieldConfig,
    childConfig?: DataTypeFields
): CoerceFN<T> {
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
            return callIfNotNil(primitiveToString) as CoerceFN<any>;
        case FieldType.IP:
            return callIfNotNil(isIPOrThrow) as CoerceFN<any>;
        case FieldType.IPRange:
            return callIfNotNil(isIPRangeOrThrow) as CoerceFN<any>;
        case FieldType.Date:
            return callIfNotNil(toEpochMSOrThrow) as CoerceFN<any>;
        case FieldType.Boolean:
            return callIfNotNil(toBooleanOrThrow) as CoerceFN<any>;
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
        case FieldType.Long:
        case FieldType.Vector:
            return callIfNotNil(
                coerceToNumberType(argFieldType.type as FieldType)
            ) as CoerceFN<any>;
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return callIfNotNil(coerceToGeoPoint) as CoerceFN<any>;
        case FieldType.Boundary:
            return callIfNotNil(coerceToGeoBoundary) as CoerceFN<any>;
        case FieldType.GeoJSON:
            return callIfNotNil(toGeoJSONOrThrow) as CoerceFN<any>;
        case FieldType.Object:
            return callIfNotNil(coerceToObject(argFieldType, childConfig)) as CoerceFN<any>;
        case FieldType.Tuple:
            return callIfNotNil(coerceToTuple(argFieldType, childConfig)) as CoerceFN<any>;
        case FieldType.Any:
            return callIfNotNil(noop);
        default:
            throw new Error(`Invalid FieldType ${argFieldType.type}, was pulled from the type field of input ${JSON.stringify(argFieldType, null, 2)}`);
    }
}

function callIfNotNil<T extends(value: any) => any>(fn: T): T {
    return function _callIfNotNil(value) {
        return value != null ? fn(value) : undefined;
    } as T;
}
