import * as R from 'rambda';
import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import { isNotNil } from './misc';
import { IndexConfig, IndexSchema } from '../interfaces';
import { throwValidationError } from './errors';

export function isValidName(name: string) {
    return ts.isString(name) && name && !name.includes('-');
}

export function isValidNamespace(namespace: string) {
    if (namespace == null) return true;
    return ts.isString(namespace) && namespace && !namespace.includes('-');
}

export function validateIndexConfig(config: any): config is IndexConfig {
    const errors: string[] = [];

    if (config == null) {
        errors.push('IndexConfig cannot be empty');
    }

    if (config && !isValidName(config.name)) {
        errors.push('Invalid name, must be a non-empty string and cannot contain a "-"');
    }

    if (config && !isValidNamespace(config.namespace)) {
        errors.push('Invalid namespace, must be a non-empty string and cannot contain a "-"');
    }

    const {
        indexSchema = { version: 1 },
        version = 1
    } = config || {};

    if (!ts.isInteger(indexSchema.version)) {
        errors.push(`Index Version must a Integer, got "${ts.getTypeOf(indexSchema.version)}"`);
    }

    if (!ts.isInteger(version)) {
        errors.push(`Data Version must a Integer, got "${ts.getTypeOf(version)}"`);
    }

    if (indexSchema.version < 1) {
        errors.push(`Index Version must be greater than 0, got "${indexSchema.version}"`);
    }

    if (version < 1) {
        errors.push(`Data Version must be greater than 0, got "${version}"`);
    }

    if (errors.length) {
        throwValidationError(errors);
    }

    return true;
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

type indexFn = (config?: IndexSchema) => boolean;

export const isSimpleIndex: indexFn = R.both(
    isNotNil,
    R.both(
        R.has('mapping'),
        R.pipe(R.path('template'), R.isNil)
    )
);

export const isTemplatedIndex: indexFn = R.both(
    isNotNil,
    R.both(
        R.has('mapping'),
        R.propEq('template', true),
    )
);

export const isTimeSeriesIndex: indexFn = R.both(
    isTemplatedIndex,
    R.propEq('timeseries', true)
);
