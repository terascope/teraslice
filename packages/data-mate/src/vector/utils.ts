import {
    DataTypeFields,
    FieldType
} from '@terascope/types';
import {
    isNumber, isBigInt, getTypeOf, isArrayLike, TSError
} from '@terascope/utils';
import { ListVector } from './ListVector';
import {
    AnyVector, BigIntVector, BooleanVector, DateVector,
    FloatVector, GeoJSONVector, GeoPointVector, IntVector,
    ObjectVector, StringVector, IPVector, IPRangeVector, TupleVector,
} from './types';
import { Vector, VectorOptions } from './Vector';
import { DataBuckets } from './interfaces';

export function _newVector<T>(
    data: DataBuckets<any>,
    options: VectorOptions
): Vector<T> {
    const fieldType = options.config.type as FieldType;
    if (!(fieldType in FieldType)) {
        throw new Error(`Unsupported field type ${fieldType}`);
    }

    if (options.config.array) {
        return new ListVector(data, options) as Vector<any>;
    }

    return _newVectorForType(data, options) as Vector<T>;
}

/**
 * Create primitive vector types, does not deal with array or object type fields
*/
function _newVectorForType(
    data: DataBuckets<any>,
    options: VectorOptions
): Vector<any> {
    switch (options.config.type as FieldType) {
        case FieldType.String:
        case FieldType.Text:
        case FieldType.Keyword:
        case FieldType.KeywordCaseInsensitive:
        case FieldType.KeywordTokens:
        case FieldType.KeywordTokensCaseInsensitive:
        case FieldType.KeywordPathAnalyzer:
        case FieldType.Domain:
        case FieldType.Hostname:
            return new StringVector(data, options);
        case FieldType.IP:
            return new IPVector(data, options);
        case FieldType.IPRange:
            return new IPRangeVector(data, options);
        case FieldType.Date:
            return new DateVector(data, options);
        case FieldType.Boolean:
            return new BooleanVector(data, options);
        case FieldType.Float:
        case FieldType.Number:
        case FieldType.Double:
            // Double can't supported entirely until we have BigFloat
            return new FloatVector(data, options);
        case FieldType.Byte:
        case FieldType.Short:
        case FieldType.Integer:
            return new IntVector(data, options);
        case FieldType.Long:
            return new BigIntVector(data, options);
        case FieldType.Geo:
        case FieldType.GeoPoint:
            return new GeoPointVector(data, options);
        case FieldType.GeoJSON:
            return new GeoJSONVector(data, options);
        case FieldType.Object:
            return new ObjectVector(data, options);
        case FieldType.Tuple:
            return new TupleVector(data, options);
        default:
            return new AnyVector(data, options);
    }
}

type NumericValuesResult = {
    readonly values: number[],
    readonly type: 'number'
}|{
    readonly values: bigint[],
    readonly type: 'bigint'
};

/**
 * Get all of the numeric values from a value or Vector
*/
export function getNumericValues(value: unknown): NumericValuesResult {
    return _getNumericValues({
        type: 'number',
        values: []
    }, value);
}

/**
 * An interval function for doing recursion recursion, made for getNumericValues
*/
function _getNumericValues(curr: NumericValuesResult, v: unknown): NumericValuesResult {
    if (v == null) return curr;

    if (isArrayLike(v)) {
        let res: NumericValuesResult = curr;
        for (const nested of v) {
            res = _getNumericValues(res, nested);
        }
        return res;
    }

    if (!isNumber(v) && !isBigInt(v)) {
        if (!Number.isNaN(v)) {
            throw new Error(`Invalid to numeric values in ${v} (${getTypeOf(v)})`);
        }
    }

    const changesToBigInt = curr.type === 'number' && isBigInt(v);

    // add the typescript hacks so will stop complaining
    (curr.values as number[]).push(v as number);

    return {
        type: changesToBigInt ? 'bigint' : curr.type,
        values: curr.values
    } as NumericValuesResult;
}

export function isNumberLike(type: FieldType): boolean {
    if (type === FieldType.Long) return true;
    return isFloatLike(type) || isIntLike(type);
}

export function isFloatLike(type: FieldType): boolean {
    if (type === FieldType.Float) return true;
    if (type === FieldType.Number) return true;
    if (type === FieldType.Double) return true;
    return false;
}

export function isIntLike(type: FieldType): boolean {
    if (type === FieldType.Byte) return true;
    if (type === FieldType.Short) return true;
    if (type === FieldType.Integer) return true;
    return false;
}

export function getCommonTupleType(
    tupleField: string, childConfig: DataTypeFields|undefined
): FieldType {
    let fieldType: FieldType|undefined;
    for (const config of Object.values(childConfig ?? {})) {
        const type = config.type as FieldType;

        if (!fieldType || type === fieldType) {
            fieldType = type;
        } else if (isIntLike(fieldType) && isIntLike(type)) {
            fieldType = FieldType.Integer;
        } else if (isFloatLike(fieldType) && isFloatLike(type)) {
            fieldType = FieldType.Float;
        } else {
            throw new TSError(
                `Field "${tupleField}" has conflicting field types, ${fieldType} incompatible with ${type}`,
                { statusCode: 400, context: { safe: true } }
            );
        }
    }
    if (!fieldType) {
        throw new TSError(
            `Field "${tupleField}" has no child fields`,
            { statusCode: 400, context: { safe: true } }
        );
    }
    return fieldType;
}
