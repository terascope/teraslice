import {
    get, isNil, isString, getTypeOf, uniq,
    isPlainObject, isNumber, isBoolean,
    isEmpty, mapValues, filterObject,
    toString
} from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import { BatchConfig, ValidatedBatchConfig } from './interfaces.js';
import { Repository, InputType, ArgSchema } from '../interfaces.js';
import { isArray } from '../validations/field-validator.js';

const batchConfigSchema: ArgSchema = {
    keys: {
        type: FieldType.String,
        array: true
    },
    source: {
        type: FieldType.String,
    },
    target: {
        type: FieldType.String,
    }
};

export const repository: Repository = {
    unique: {
        fn: unique,
        config: batchConfigSchema,
        output_type: FieldType.Any,
        primary_input_type: InputType.Array
    },
    count: {
        fn: count,
        config: batchConfigSchema,
        output_type: FieldType.Integer,
        primary_input_type: InputType.Array
    },
    sum: {
        fn: sum,
        config: batchConfigSchema,
        output_type: FieldType.Integer,
        primary_input_type: InputType.Array
    },
    avg: {
        fn: avg,
        config: batchConfigSchema,
        output_type: FieldType.Integer,
        primary_input_type: InputType.Array
    },
    min: {
        fn: min,
        config: batchConfigSchema,
        output_type: FieldType.Integer,
        primary_input_type: InputType.Array
    },
    max: {
        fn: max,
        config: batchConfigSchema,
        output_type: FieldType.Integer,
        primary_input_type: InputType.Array
    }
};

function validateConfig(config: BatchConfig): ValidatedBatchConfig {
    if (!isPlainObject(config)) throw new Error('Parameter config must be provided and be an object');
    if (!isString(config.source)) throw new Error(`Parameter source must be provided and be a string, received ${getTypeOf(config.source)}`);
    if (config.target && !isString(config.target)) throw new Error(`Parameter target must be a string, received ${getTypeOf(config.target)}`);

    if (isNil(config.target)) config.target = config.source;
    // TODO: should we enforce keys are strings? maps and sets can have non string keys
    const keys = config.keys || [];
    config.keys = keys;

    return config as ValidatedBatchConfig;
}

function _getNumbers(input: any) {
    if (isNumber(input)) return [input];
    if (isArray(input)) return input.filter(isNumber);

    return [];
}

function _filterValues(input: any) {
    if (isArray(input)) {
        return input.filter(_isValueNotEmpty);
    }

    return [input].filter(_isValueNotEmpty);
}

function _isValueNotEmpty(data: any): boolean {
    return isNumber(data) || isBoolean(data) || !isEmpty(data);
}

interface AggregationResults {
    data: AggregationData;
    keyRecord: Record<string, any>;
}

interface AggregationData {
    [key: string]: any[];
}

interface FilterFn {
    (input: any): any | null;
}

type Batch = Map<string, AggregationResults>;

function _iterateBatch(batch: Batch, fn: any) {
    const results: any[] = [];

    for (const aggregationConfig of batch.values()) {
        const aggResults = mapValues(aggregationConfig.data, fn);
        const aggregation = Object.assign({}, aggregationConfig.keyRecord, aggResults);
        results.push(aggregation);
    }

    return results;
}

function batchByKeys(input: any, config: ValidatedBatchConfig, filterFn: FilterFn) {
    const data = isArray(input) ? input : [input];
    const { source, target } = config;
    const batch: Batch = new Map<string, AggregationResults>();
    const keys = config.keys || [];
    const hasKeys = keys.length !== 0;
    const excludes = keys.includes(source) ? [] : [source];
    const filterConfig = { excludes, includes: keys };
    // we batch based of target key since it will be collapsed

    for (const record of data) {
        const rawFieldData = get(record, source);
        const fieldData = filterFn(rawFieldData);

        if (isNil(fieldData)) continue;

        const keyRecord = hasKeys ? filterObject(record, filterConfig) : { [target]: true };
        const key = Object.keys(keyRecord)
            .map((objKey) => `${objKey}-${toString(keyRecord[objKey])}`)
            .join(':');

        if (batch.has(key)) {
            const batchData = batch.get(key) as AggregationResults;
            batchData.data[target].push(...fieldData);
        } else {
            const aggregationData = {
                data: { [target]: fieldData },
                keyRecord
            };
            batch.set(key, aggregationData);
        }
    }

    return batch;
}

export function unique(
    input: unknown, _parentContext: unknown, batchConfig: BatchConfig
): any[] | null {
    const config = validateConfig(batchConfig);
    if (isNil(input)) return null;

    const batchData = batchByKeys(input, config, _filterValues);
    return _iterateBatch(batchData, uniq);
}

export function count(
    input: unknown, _parentContext: unknown, batchConfig: BatchConfig
): any[] | null {
    const config = validateConfig(batchConfig);
    if (isNil(input)) return null;

    const batchData = batchByKeys(input, config, _filterValues);
    const results = _iterateBatch(batchData, _length);

    return results;
}

function _length(val: any[]) {
    return val.length;
}

export function sum(
    input: unknown,
    _parentContext: unknown,
    batchConfig: BatchConfig
): any[] | null {
    const config = validateConfig(batchConfig);
    if (isNil(input)) return null;

    const batchData = batchByKeys(input, config, _getNumbers);
    return _iterateBatch(batchData, _sum);
}

function _sum(input: number[]) {
    return input.reduce((prev, curr) => prev + curr, 0);
}

export function avg(
    input: unknown, _parentContext: unknown, batchConfig: BatchConfig
): any[] | null {
    const config = validateConfig(batchConfig);
    if (isNil(input)) return null;

    const batchData = batchByKeys(input, config, _getNumbers);
    return _iterateBatch(batchData, _avg);
}

function _avg(input: number[]) {
    if (input.length === 0) return 0;
    return _sum(input) / input.length;
}

export function min(
    input: unknown, _parentContext: unknown, batchConfig: BatchConfig
): any[] | null {
    const config = validateConfig(batchConfig);
    if (isNil(input)) return null;

    const batchData = batchByKeys(input, config, _getNumbers);
    return _iterateBatch(batchData, (num: number[]) => Math.min.apply(null, num));
}

export function max(
    input: unknown, _parentContext: unknown, batchConfig: BatchConfig
): any[] | null {
    const config = validateConfig(batchConfig);
    if (isNil(input)) return null;

    const batchData = batchByKeys(input, config, _getNumbers);
    return _iterateBatch(batchData, (num: number[]) => Math.max.apply(null, num));
}
