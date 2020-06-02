import * as ts from '@terascope/utils';
import { AvailableType } from '@terascope/data-types';
import { BatchConfig, ValidatedBatchConfig } from './interfaces';
import { Repository, InputType, ArgSchema } from '../interfaces';
import { isArray } from '../validations/field-validator';

const batchConfigSchema: ArgSchema = {
    keys: {
        type: 'String',
        array: true
    },
    source: {
        type: 'String',
    },
    target: {
        type: 'String',
    }
};

export const repository: Repository = {
    unique: {
        fn: unique,
        config: batchConfigSchema,
        output_type: 'Any' as AvailableType,
        primary_input_type: InputType.Array
    },
    count: {
        fn: count,
        config: batchConfigSchema,
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    },
    sum: {
        fn: sum,
        config: batchConfigSchema,
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    },
    avg: {
        fn: avg,
        config: batchConfigSchema,
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    },
    min: {
        fn: min,
        config: batchConfigSchema,
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    },
    max: {
        fn: max,
        config: batchConfigSchema,
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    }
};

function validateConfig(config: BatchConfig): ValidatedBatchConfig {
    if (!ts.isPlainObject(config)) throw new Error('Paramter config must be provided and be an object');
    if (!ts.isString(config.source)) throw new Error(`Parameter source must be provided and be a string, recieved ${ts.getTypeOf(config.source)}`);
    if (config.target && !ts.isString(config.target)) throw new Error(`Parameter target must be a string, recieved ${ts.getTypeOf(config.target)}`);

    if (ts.isNil(config.target)) config.target = config.source;
    // TODO: should we enforce keys are strings? maps and sets can have non string keys
    const keys = config.keys || [];
    config.keys = keys;

    return config as ValidatedBatchConfig;
}

function _getNumbers(input: any) {
    if (ts.isNumber(input)) return [input];
    if (isArray(input)) return input.filter(ts.isNumber);

    return [];
}

function _filterValues(input: any) {
    if (isArray(input)) {
        return input.filter(_isValueNotEmpty);
    }

    return [input].filter(_isValueNotEmpty);
}

function _isValueNotEmpty(data: any): boolean {
    return ts.isNumber(data) || ts.isBoolean(data) || !ts.isEmpty(data);
}

interface AggregationResults {
    data: AggregationData;
    keyRecord: ts.AnyObject;
}

interface AggregationData {
    [key: string]: any[];
}

interface FilterFn {
    (input: any): any | null;
}

type Batch = Map<string, AggregationResults>

function _iterateBatch(batch: Batch, fn: any) {
    const results: any[] = [];

    for (const aggregationConfig of batch.values()) {
        const aggResults = ts.mapValues(aggregationConfig.data, fn);
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
        const rawFieldData = ts.get(record, source);
        const fieldData = filterFn(rawFieldData);

        if (ts.isNil(fieldData)) continue;

        const keyRecord = hasKeys ? ts.filterObject(record, filterConfig) : { [target]: true };
        const key = Object.keys(keyRecord)
            .map((objKey) => `${objKey}-${ts.toString(keyRecord[objKey])}`)
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

export function unique(input: any, _parentContext: any, batchConfig: BatchConfig): any[] | null {
    const config = validateConfig(batchConfig);
    if (ts.isNil(input)) return null;

    const batchData = batchByKeys(input, config, _filterValues);
    return _iterateBatch(batchData, ts.uniq);
}

export function count(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);
    if (ts.isNil(input)) return null;

    const batchData = batchByKeys(input, config, _filterValues);
    const results = _iterateBatch(batchData, _length);

    return results;
}

function _length(val: any[]) {
    return val.length;
}

export function sum(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);
    if (ts.isNil(input)) return null;

    const batchData = batchByKeys(input, config, _getNumbers);
    return _iterateBatch(batchData, _sum);
}

function _sum(input: number[]) {
    return input.reduce((prev, curr) => prev + curr, 0);
}

export function avg(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);
    if (ts.isNil(input)) return null;

    const batchData = batchByKeys(input, config, _getNumbers);
    return _iterateBatch(batchData, _avg);
}

function _avg(input: number[]) {
    if (input.length === 0) return 0;
    return _sum(input) / input.length;
}

export function min(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);
    if (ts.isNil(input)) return null;

    const batchData = batchByKeys(input, config, _getNumbers);
    return _iterateBatch(batchData, (num: number[]) => Math.min.apply(null, num));
}

export function max(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);
    if (ts.isNil(input)) return null;

    const batchData = batchByKeys(input, config, _getNumbers);
    return _iterateBatch(batchData, (num: number[]) => Math.max.apply(null, num));
}
