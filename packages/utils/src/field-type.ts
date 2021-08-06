import {
    DataTypeFieldConfig, FieldType,
    DataTypeFields, ReadonlyDataTypeFields,
    GeoPoint
} from '@terascope/types';
import { createHash } from 'crypto';
import { primitiveToString, toString } from './strings';
import { isIPRangeOrThrow, isIPOrThrow } from './ip';
import { toEpochMSOrThrow } from './dates';
import { toBooleanOrThrow } from './booleans';
import {
    isValidateNumberType, toBigIntOrThrow, toFloatOrThrow,
    toNumberOrThrow, bigIntToJSON, toIntegerOrThrow
} from './numbers';
import { toGeoJSONOrThrow, parseGeoPoint } from './geo';
import { hasOwn } from './objects';
import { isArrayLike, castArray } from './arrays';
import { getTypeOf, isPlainObject } from './deps';
import { isFunction, noop } from './functions';
import { isNotNil } from './empty';

export const HASH_CODE_SYMBOL = Symbol('__hash__');

type CoerceFN<T = unknown> = (input: unknown) => T

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
        return createArrayValue(castArray(inputs).map(fn)) as unknown as T;
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
};

export function coerceToNumberType(type: FieldType): (input: unknown) => number {
    const numberValidator = isValidateNumberType(type);
    const coerceFn = NumberTypeFNDict[type];
    const smallSize = _shouldCheckIntSize(type);

    if (coerceFn == null) {
        throw new Error(`Unsupported type ${type}, please provide a valid numerical field type`);
    }

    return function _coerceToNumberType(input: unknown): number {
        const num = coerceFn(input);

        if (smallSize) {
            if (numberValidator(input)) return num;
            throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be a a valid ${type}`);
        }

        return num;
    };
}

function coerceToGeoPoint(input: unknown): GeoPoint {
    return parseGeoPoint(input, true);
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

export function getHashCodeFrom(input: unknown): string {
    if (typeof input === 'object' && input != null && input[HASH_CODE_SYMBOL] != null) {
        if (isFunction(input[HASH_CODE_SYMBOL])) {
            return input[HASH_CODE_SYMBOL]();
        }
        return input[HASH_CODE_SYMBOL];
    }
    return createHashCode(input);
}

export function md5(value: string|Buffer): string {
    return createHash('md5').update(value).digest('hex');
}

export function createHashCode(value: unknown): string {
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
export function createObjectValue<T extends Record<string, any>>(input: T): T {
    Object.defineProperty(input, HASH_CODE_SYMBOL, {
        value: _createObjectHashCode.bind(input),
        configurable: false,
        enumerable: false,
        writable: false,
    });

    return input;
}

/** create an immutable array */
export function createArrayValue<T extends any[]>(input: T): T {
    Object.defineProperty(input, HASH_CODE_SYMBOL, {
        value: _createArrayHashCode.bind(input),
        configurable: false,
        enumerable: false,
        writable: false,
    });

    return input;
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

type ChildFields = readonly (
    [field: string, transformer: CoerceFN]
)[];

function formatObjectChildFields(childConfigs?: DataTypeFields) {
    if (!childConfigs) {
        return [];
    }

    const childFields: ChildFields = Object.entries(childConfigs)
        .map(([field, config]): [field: string, transformer: CoerceFN]|undefined => {
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
            return createObjectValue({ ...input as Record<string, unknown> });
        }

        const value = input as Readonly<Record<string, unknown>>;

        function _valueMap([field, transformer]: [field: string, transformer: CoerceFN]) {
            return [field, transformer(value[field])];
        }
        return createObjectValue(Object.fromEntries(childFields.map(_valueMap)));
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

        return createArrayValue(childFields.map((transformer, index) => transformer(input[index])));
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
            return callIfNotNil(
                coerceToNumberType(argFieldType.type as FieldType)
            ) as CoerceFN<any>;
        case FieldType.Geo:
        case FieldType.GeoPoint:
        case FieldType.Boundary:
            return callIfNotNil(coerceToGeoPoint) as CoerceFN<any>;
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
