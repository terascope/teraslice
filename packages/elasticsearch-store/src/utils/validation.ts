import Ajv from 'ajv';
import * as ts from '@terascope/utils';
import { Client } from '../../src';
import { IndexConfig, IndexSchema, DataSchema } from '../interfaces';
import { throwValidationError, getErrorMessages } from './errors';

export function isValidName(name: string): boolean {
    return Boolean(ts.isString(name) && name && !name.includes('-'));
}

export function validateId(id: unknown, action: string, throwError = true): id is string {
    if (!id) {
        if (!throwError) return false;
        throw new ts.TSError(`Missing required ID for ${action}`, {
            statusCode: 400
        });
    }

    if (ts.isString(id)) return true;
    if (!throwError) return false;

    throw new ts.TSError(`Invalid ID given to ${action}, expected string, got ${ts.getTypeOf(id)}`, {
        statusCode: 400
    });
}

export function validateIds(ids: unknown, action: string): string[] {
    return ts.uniq(ts.castArray(ids)).filter((id) => validateId(id, action, false)) as string[];
}

export function isValidNamespace(namespace: string): boolean {
    if (namespace == null) return true;
    return Boolean(ts.isString(namespace) && namespace && !namespace.includes('-'));
}

export function makeDataValidator(
    dataSchema: DataSchema, logger: ts.Logger
): (input: any, critical: boolean) => any {
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

export function validateIndexConfig(config: Record<string, any>): config is IndexConfig<any> {
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

export function isValidClient(input: unknown): input is Client {
    if (input == null) return false;
    if (typeof input !== 'object') return false;

    const reqKeys = ['indices', 'index', 'get', 'search'];

    return reqKeys.every((key) => (input as any)[key] != null);
}

export function isTemplatedIndex(config?: IndexSchema): boolean {
    return ts.has(config, 'mapping') || ts.get(config, 'template') === true;
}

export function isTimeSeriesIndex(config?: IndexSchema): boolean {
    return isTemplatedIndex(config) && ts.get(config, 'timeseries') === true;
}
