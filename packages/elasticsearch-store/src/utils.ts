import get from 'lodash.get';
import {
    isString,
    isInteger,
    getTypeOf,
    getFirst,
    TSError,
} from '@terascope/utils';
import * as es from 'elasticsearch';
import * as i from './interfaces';
import { throwValidationError } from './error-utils';

export function isSimpleIndex(input?: i.IndexSchema): boolean {
    return get(input, 'mapping') != null && !get(input, 'template', false);
}

export function isTemplatedIndex(input?: i.IndexSchema): boolean {
    return get(input, 'mapping') != null && !!get(input, 'template', false);
}

export function isTimeSeriesIndex(input?: i.IndexSchema): boolean {
    return isTemplatedIndex(input) && !!get(input, 'timeseries', false);
}

export function isValidClient(input: any): input is es.Client {
    if (input == null) return false;

    const reqKeys = [
        'indices',
        'index',
        'get',
        'search',
    ];

    return reqKeys.every((key) => input[key] != null);
}

export function validateIndexConfig(config: any): config is i.IndexConfig {
    const errors: string[] = [];

    if (config == null) {
        errors.push('IndexConfig cannot be empty');
    }

    if (config && (!isString(config.name) || !config.name || config.name.includes('-'))) {
        errors.push('Invalid name, must be a non-empty string and cannot contain a "-"');
    }

    const {
        indexSchema = { version: 1 },
        version = 1
    } = config || {};

    if (!isInteger(indexSchema.version)) {
        errors.push(`Index Version must a Integer, got "${getTypeOf(indexSchema.version)}"`);
    }

    if (!isInteger(version)) {
        errors.push(`Data Version must a Integer, got "${getTypeOf(version)}"`);
    }

    if (indexSchema.version < 1) {
        errors.push(`Index Version must be greater than 0, got "${indexSchema.version}"`);
    }

    if (version < 1) {
        errors.push(`Data Version must be greater than 0, got "${version}"`);
    }

    if (errors.length) {
        throwValidationError(errors.map((message) => ({ message })));
    }

    return true;
}

export function timeseriesIndex(index: string, timeSeriesFormat: i.TimeSeriesFormat = 'monthly'): string {
    const formatter = {
        daily: 10,
        monthly: 7,
        yearly: 4
    };

    const format = formatter[timeSeriesFormat];
    if (!format) throw new Error(`Unsupported format "${timeSeriesFormat}"`);

    const dateStr = new Date().toISOString();
    // remove -* or * at the end of the index name
    const indexName = index.replace(/\-{0,1}\*$/, '');
    return `${indexName}-${dateStr.slice(0, format).replace(/-/g, '.')}`;
}

type BulkResponseItemResult = {
    item: i.BulkResponseItem,
    action: i.BulkAction
};

export function getBulkResponseItem(input: any = {}): BulkResponseItemResult  {
    const item = getFirst(Object.values(input));
    const action = getFirst(Object.keys(input)) as i.BulkAction;

    return {
        item,
        action,
    };
}

export function filterBulkRetries<T>(records: T[], result: i.BulkResponse): T[] {
    if (!result.errors) return [];

    const retry = [];
    const { items } = result;
    const errorTypes = ['document_already_exists_exception', 'document_missing_exception'];

    for (let i = 0; i < items.length; i += 1) {
        // key could either be create or delete etc, just want the actual data at the value spot
        const { item } = getBulkResponseItem(items[i]);

        // On a create request if a document exists it's not an error.
        // are there cases where this is incorrect?
        if (item.error && item.status !== 409) {
            const type = get(item, 'error.type', '');

            if (type === 'es_rejected_execution_exception') {
                // retry this record
                if (records[i] != null) {
                    retry.push(records[i]);
                }
            } else if (errorTypes.includes(type)) {
                const error = new TSError(`${type}--${item.error.reason}`);
                Error.captureStackTrace(error, filterBulkRetries);
                throw error;
            }
        }
    }

    return retry;
}
