import * as ts from '@terascope/utils';
import { AvailableType } from '@terascope/data-types';
import { BatchConfig, ValidatedBatchConfig } from './interfaces';
import { Repository, InputType } from '../interfaces';
import { isArray } from '../validations/field-validator';

export const repository: Repository = {
    unique: {
        fn: unique,
        config: {},
        output_type: 'Any' as AvailableType,
        primary_input_type: InputType.Array
    },
    count: {
        fn: count,
        config: {},
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    },
    sum: {
        fn: sum,
        config: {},
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    },
    avg: {
        fn: avg,
        config: {},
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    },
    min: {
        fn: min,
        config: {},
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    },
    max: {
        fn: max,
        config: {},
        output_type: 'Integer' as AvailableType,
        primary_input_type: InputType.Array
    }
};

function validateConfig(config: BatchConfig): ValidatedBatchConfig {
    if (!ts.isPlainObject(config)) throw new Error('Paramter config must be provided and be an object');
    if (!ts.isString(config.sourceField)) throw new Error(`Parameter sourceField must be provided and be a string, recieved ${ts.getTypeOf(config.sourceField)}`);
    if (config.targetField && !ts.isString(config.targetField)) throw new Error(`Parameter targetField must be a string, recieved ${ts.getTypeOf(config.targetField)}`);

    if (ts.isNil(config.targetField)) config.targetField = config.sourceField;
    // TODO: should we enforce keys are strings? maps and sets can have non string keys
    const keys = config.keys || [];
    config.keys = keys;

    return config as ValidatedBatchConfig;
}

function getNumbers(input: any) {
    if (ts.isNumber(input)) return [input];
    if (isArray(input)) return input.filter(ts.isNumber);

    return null;
}

interface AggregationResults {
    data: AggregationData;
    keyRecord: ts.AnyObject;
}

interface AggregationData {
    [key: string]: number[];
}

function batchByKeys(input: any, config: ValidatedBatchConfig) {
    const data = isArray(input) ? input : [input];
    const { sourceField, targetField } = config;
    const batch = new Map<string, AggregationResults>();
    const keys = config.keys || [];
    const hasKeys = keys.length !== 0;
    const excludes = { excludes: [sourceField] };
    // we batch based of target key since it will be collapsed

    for (const record of data) {
        const rawFieldData = ts.get(record, sourceField);
        const fieldData = getNumbers(rawFieldData);
        if (ts.isNil(fieldData)) continue;

        const keyRecord = hasKeys ? ts.filterObject(record, excludes) : { [targetField]: true };
        const key = Object.keys(keyRecord)
            .map((objKey) => `${objKey}-${ts.toString(keyRecord[objKey])}`)
            .join(':');

        if (batch.has(key)) {
            const batchData = batch.get(key) as AggregationResults;
            batchData.data[targetField].push(...fieldData);
        } else {
            const aggregationData = {
                data: { [targetField]: fieldData },
                keyRecord
            };
            batch.set(key, aggregationData);
        }
    }

    return batch;
}

export function unique(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);

    if (ts.isNil(input)) return null;
    if (isArray(input)) {
        const batchData = batchByKeys(input, config);
        const results: any[] = [];

        for (const aggregationObj of batchData.values()) {
            const aggResults = ts.mapValues(aggregationObj.data, ts.uniq);
            const aggregation = Object.assign({}, aggregationObj.keyRecord, aggResults);
            results.push(aggregation);
        }

        return results;
    }

    return input;
}

export function count(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);

    if (ts.isNil(input)) return 0;
    if (isArray(input)) return input.length;
    return 1;
}

export function sum(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);

    if (ts.isNil(input)) return null;
    if (isArray(input)) {
        return input
            .filter(ts.isNumber)
            .reduce((prev, curr) => prev + curr, 0);
    }

    if (ts.isNumber(input)) return input;
    return null;
}

export function avg(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);

    if (ts.isNil(input)) return null;
    if (isArray(input)) {
        const numbers = input
            .filter(ts.isNumber);

        const { length } = numbers;

        if (length === 0) return 0;
        return numbers.reduce((prev, curr) => prev + curr, 0) / length;
    }

    if (ts.isNumber(input)) return input;
    return null;
}

export function min(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);

    if (ts.isNil(input)) return null;
    if (isArray(input)) {
        const numbers = input.filter(ts.isNumber);
        return Math.min.apply(null, numbers);
    }

    if (ts.isNumber(input)) return input;
    return null;
}

export function max(input: any, _parentContext: any, batchConfig: BatchConfig) {
    const config = validateConfig(batchConfig);

    if (ts.isNil(input)) return null;
    if (isArray(input)) {
        const numbers = input.filter(ts.isNumber);
        return Math.max.apply(null, numbers);
    }

    if (ts.isNumber(input)) return input;
    return null;
}
