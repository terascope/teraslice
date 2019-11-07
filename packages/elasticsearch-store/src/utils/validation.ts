import Ajv from 'ajv';
import * as R from 'rambda';
import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import { isNotNil } from './misc';
import { IndexConfig, IndexSchema, DataSchema } from '../interfaces';
import { throwValidationError, getErrorMessages } from './errors';

export function isValidName(name: string) {
    return ts.isString(name) && name && !name.includes('-');
}

export function validateId(id: any, action: string): id is string|number {
    if (ts.isString(id) && id) return true;
    if (ts.isInteger(id)) return true;
    throw new ts.TSError(`Invalid ID given to ${action}, expected string or integer, got ${ts.getTypeOf(id)}`, {
        statusCode: 400
    });
}

export function isValidNamespace(namespace: string) {
    if (namespace == null) return true;
    return ts.isString(namespace) && namespace && !namespace.includes('-');
}

export function makeDataValidator(dataSchema: DataSchema, logger: ts.Logger) {
    const {
        all_formatters: allFormatters,
        schema,
        strict
    } = dataSchema;
    const ajv = new Ajv({
        useDefaults: true,
        format: allFormatters ? 'full' : 'fast',
        allErrors: true,
        coerceTypes: true,
        logger: {
            log: logger.trace,
            warn: logger.debug,
            error: logger.warn,
        },
    });
    const validate = ajv.compile(schema);

    return (input: any, critical: boolean) => {
        if (validate(input)) return input;

        if (critical) {
            throwValidationError(validate.errors);
        } else if (strict === true) {
            logger.warn('Invalid record', input, getErrorMessages(validate.errors || []));
        } else {
            logger.trace('Record validation warnings', input, getErrorMessages(validate.errors || []));
        }
        return input;
    };
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
        index_schema: indexSchema = { version: 1 },
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

    const reqKeys = ['indices', 'index', 'get', 'search'];

    return reqKeys.every((key) => input[key] != null);
}

type indexFn = (config?: IndexSchema) => boolean;

export const isSimpleIndex: indexFn = R.both(
    isNotNil,
    R.both(
        R.has('mapping'),
        R.pipe(
            R.path(['template']),
            R.isNil
        )
    )
);

export const isTemplatedIndex: indexFn = R.both(isNotNil, R.both(R.has('mapping'), R.propEq('template', true)));

export const isTimeSeriesIndex: indexFn = R.both(isTemplatedIndex, R.propEq('timeseries', true));
