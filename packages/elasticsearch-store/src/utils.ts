import get from 'lodash.get';
import {
    isString,
    isInteger,
    getTypeOf,
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
