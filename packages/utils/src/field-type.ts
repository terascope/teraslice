import {
    DataTypeFieldConfig, FieldType,
    GeoShape, GeoPoint, GeoPointInput,
    DataTypeFields, ReadonlyDataTypeFields
} from '@terascope/types';
import { createHash } from 'crypto';
import {
    isString, primitiveToString, toString
} from './strings';
import {
    isIP, isCIDR, isIPRangeOrThrow
} from './ip';
import {
    isValidDate,
    toEpochMSOrThrow
} from './dates';
import { isBoolean, toBooleanOrThrow } from './booleans';
import {
    isNumber, isValidateNumberType, isBigInt,
    toBigIntOrThrow, toFloatOrThrow, toNumberOrThrow,
    bigIntToJSON, toIntegerOrThrow
} from './numbers';
import {
    isGeoPoint, isGeoJSON, toGeoJSONOrThrow, parseGeoPoint
} from './geo';
import { isObjectEntity, hasOwn } from './objects';
import {
    isArray, isArrayLike, castArray
} from './arrays';
import { getTypeOf, isPlainObject } from './deps';
import { isFunction } from './functions';
import { isNotNil } from './empty';

export const HASH_CODE_SYMBOL = Symbol('__hash__');

type CoerceFN<T = unknown> = (input: unknown) => T

export function coerceToType<T = unknown>(
    fieldConfig: DataTypeFieldConfig,
    childConfig?: DataTypeFields
): (input: unknown|unknown[]) => T {
    if (fieldConfig.array) {
        const newFieldConfig = { ...fieldConfig, array: false };
        const fn = getTransformerForFieldType<T>(newFieldConfig, childConfig);
        const converter = (value: unknown) => (
            value != null ? fn(value) : null
        );

        return function _coerceToType(inputs: unknown) {
            return createArrayValue(
                castArray(inputs).map(converter)
            ) as unknown as T;
        };
    }

    return getTransformerForFieldType<T>(fieldConfig, childConfig) as CoerceFN<T>;
}

// We convert Int, Byte and Short to Integers
function _shouldConvertToInteger(type: FieldType) {
    return [FieldType.Integer, FieldType.Byte, FieldType.Short].includes(type);
}

export function isIPOrThrow(input: unknown): string {
    const ipValue = primitiveToString(input);

    if (!isString(input) || !isIP(ipValue)) {
        throw new TypeError(`Expected ${ipValue} (${getTypeOf(input)}) to be a valid IP`);
    }

    return ipValue;
}

export function coerceToNumberType(type: FieldType): (input: unknown) => number {
    const numberValidator = isValidateNumberType(type);
    const coerceFn = _shouldConvertToInteger(type) ? toIntegerOrThrow : toNumberOrThrow;

    return function _coerceToNumberType(input: unknown): number {
        const num = coerceFn(input);
        if (numberValidator(num)) return num;
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be a a valid ${type}`);
    };
}

const weakSet = new WeakSet();

function coerceToGeoJSON(input: unknown) {
    if (typeof input === 'object' && input != null && weakSet.has(input)) {
        return input as GeoShape;
    }

    const result = toGeoJSONOrThrow(input);

    weakSet.add(result);

    return result;
}

const geoPointWeakSet = new WeakSet();

function coerceToGeoPoint(input: unknown) {
    if (typeof input === 'object' && input != null && geoPointWeakSet.has(input)) {
        return input as GeoPoint;
    }

    const result = Object.freeze(
        parseGeoPoint(input as GeoPointInput, true)
    );

    geoPointWeakSet.add(result);
    return result;
}

function _mapToString(input: any): string {
    let hash = '';

    if (isArrayLike(input)) {
        for (const value of input) {
            hash += `,${getHashCodeFrom(value)}`;
        }
    } else {
        for (const prop in input) {
            if (hasOwn(input, prop)) {
                hash += `,${prop}:${getHashCodeFrom(input[prop])}`;
            }
        }
    }

    return hash;
}

function getHashCodeFrom(input: unknown): string {
    if (typeof input === 'object' && input != null && input[HASH_CODE_SYMBOL] != null) {
        if (isFunction(input[HASH_CODE_SYMBOL])) {
            return input[HASH_CODE_SYMBOL]();
        }
        return input[HASH_CODE_SYMBOL];
    }
    return createHashCode(input);
}

function md5(value: string|Buffer): string {
    return createHash('md5').update(value).digest('hex');
}

function createHashCode(value: unknown): string {
    if (value == null) return '~';
    if (typeof value === 'bigint') return `|${bigIntToJSON(value)}`;

    const hash = typeof value === 'object'
        ? _mapToString(value)
        : primitiveToString(value);

    if (hash.length > 35) return `;${md5(hash)}`;
    return `:${hash}`;
}

function _createObjectHashCode(): string {
    // @ts-expect-error because this bound
    return createHashCode(Object.entries(this));
}

/** creates an immutable object */
export function createObjectValue<T extends Record<string, any>>(input: T, skipFreeze = false): T {
    Object.defineProperty(input, HASH_CODE_SYMBOL, {
        value: _createObjectHashCode.bind(input),
        configurable: false,
        enumerable: false,
        writable: false,
    });

    if (skipFreeze) return input;
    return Object.freeze(input) as T;
}

/** create an immutable array */
export function createArrayValue<T extends any[]>(input: T): T {
    Object.defineProperty(input, HASH_CODE_SYMBOL, {
        value: _createArrayHashCode.bind(input),
        configurable: false,
        enumerable: false,
        writable: false,
    });

    return Object.freeze(input) as T;
}

function _createArrayHashCode(): string {
    // @ts-expect-error because this bound
    return createHashCode(this, false);
}

function getChildDataTypeConfig(
    config: DataTypeFields|ReadonlyDataTypeFields,
    baseField: string,
    fieldType: FieldType
): DataTypeFields|undefined {
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

type TFN = (input: unknown) => unknown;

type ChildFields = readonly (
    [field: string, transformer: TFN]
)[];

function formatObjectChildFields(childConfigs?: DataTypeFields) {
    if (!childConfigs) {
        return [];
    }

    const childFields: ChildFields = Object.entries(childConfigs)
        .map(([field, config]): [field: string, transformer: TFN]|undefined => {
            const [base] = field.split('.');
            if (base !== field && childConfigs![base]) return;

            const childConfig = getChildDataTypeConfig(
                childConfigs!, field, config.type as FieldType
            );

            const transformer = coerceToType(config, childConfig);

            return [field, transformer];
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
            return createObjectValue({ ...input as Record<string, unknown> }, false);
        }

        const value = input as Readonly<Record<string, unknown>>;
        const result = Object.create(null);

        for (const [field, transformer] of childFields) {
            if (value[field] != null) {
                const fieldValue: any = transformer(value[field]);
                Object.defineProperty(result, field, {
                    value: fieldValue,
                    enumerable: true,
                    writable: false
                });
            }
        }

        return createObjectValue(result, true);
    };
}

function formatTupleChildFields(childConfigs?: DataTypeFields) {
    if (!childConfigs) {
        return [];
    }

    const childFields: TFN[] = Object.entries(childConfigs)
        .map(([field, config]) => {
            const childConfig = getChildDataTypeConfig(
                childConfigs!, field, config.type as FieldType
            );
            return coerceToType(config, childConfig);
        });

    return childFields;
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

        return createArrayValue(childFields.map((transformer, index) => {
            const value = input[index];
            return value != null ? transformer(value) : null;
        }));
    };
}

/** This is a low level api, only coerceToType should reference this,
 * all other transforms should reference coerceToType as it handles arrays
*/
function getTransformerForFieldType<T = unknown>(
    argFieldType: DataTypeFieldConfig,
    childConfig?: DataTypeFields
): (input: unknown) => T|unknown {
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
            return primitiveToString;
        case FieldType.IP:
            return isIPOrThrow;
        case FieldType.IPRange:
            return isIPRangeOrThrow;
        case FieldType.Date:
            return toEpochMSOrThrow;
        case FieldType.Boolean:
            return toBooleanOrThrow;
        case FieldType.Float:
            return toFloatOrThrow;
        case FieldType.Number:
        case FieldType.Double:
            return toNumberOrThrow;
        case FieldType.Byte:
            return coerceToNumberType(FieldType.Byte);
        case FieldType.Short:
            return coerceToNumberType(FieldType.Short);
        case FieldType.Integer:
            return coerceToNumberType(FieldType.Integer);
        case FieldType.Long:
            return toBigIntOrThrow;
        case FieldType.Geo:
        case FieldType.GeoPoint:
        case FieldType.Boundary:
            return coerceToGeoPoint;
        case FieldType.GeoJSON:
            return coerceToGeoJSON;
        case FieldType.Object:
            return coerceToObject(argFieldType, childConfig);
        case FieldType.Tuple:
            return coerceToTuple(argFieldType, childConfig);
        default:
            // equivalent to an any-builder
            return (input) => input;
    }
}

export function getValidatorForFieldType(
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
            return isCIDR;
        case FieldType.Date:
            return isValidDate;
        case FieldType.Boolean:
            return isBoolean;
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            return isNumber;
        case FieldType.Byte:
            return isValidateNumberType(FieldType.Byte);
        case FieldType.Short:
            return isValidateNumberType(FieldType.Short);
        case FieldType.Integer:
            return isValidateNumberType(FieldType.Integer);
        case FieldType.Long:
            return _isIntOrBigint;
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

function _isIntOrBigint(input: unknown): boolean {
    return isBigInt(input) || isNumber(input);
}
