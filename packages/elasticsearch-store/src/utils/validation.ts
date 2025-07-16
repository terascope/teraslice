import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
    isString, TSError, uniq,
    castArray, Logger, getTypeOf,
    isInteger, get, has
} from '@terascope/utils';
import type { Client } from '../elasticsearch-client/index.js';
import { IndexConfig, IndexSchema, DataSchema } from '../interfaces.js';
import { throwValidationError, getErrorMessages } from './errors.js';

export function isValidName(name: string): boolean {
    return Boolean(isString(name) && name && !name.includes('-'));
}

export function validateId(id: unknown, action: string, throwError = true): id is string {
    if (!id) {
        if (!throwError) return false;
        throw new TSError(`Missing required ID for ${action}`, {
            statusCode: 400
        });
    }

    if (isString(id)) return true;
    if (!throwError) return false;

    throw new TSError(`Invalid ID given to ${action}, expected string, got ${getTypeOf(id)}`, {
        statusCode: 400
    });
}

export function validateIds(ids: unknown, action: string): string[] {
    return uniq(castArray(ids)).filter((id) => validateId(id, action, false)) as string[];
}

export function isValidNamespace(namespace: string): boolean {
    if (namespace == null) return true;
    return Boolean(isString(namespace) && namespace && !namespace.includes('-'));
}

export function makeDataValidator(
    dataSchema: DataSchema, logger: Logger
): (input: any, critical: boolean) => any {
    const {
        all_formatters: allFormatters,
        schema,
        strict
    } = dataSchema;
    const ajv = new Ajv({
        useDefaults: true,
        allErrors: true,
        coerceTypes: true,
        logger: {
            log: logger.trace,
            warn: logger.debug,
            error: logger.warn,
        },
    });
    addFormats(ajv, { mode: allFormatters ? 'full' : 'fast' });
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
    return has(config, 'mapping') || get(config, 'template') === true;
}

export function isTimeSeriesIndex(config?: IndexSchema): boolean {
    return isTemplatedIndex(config) && get(config, 'timeseries') === true;
}
