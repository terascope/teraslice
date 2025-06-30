import type { Logger } from '@terascope/types';
import STATUS_CODES from './status-codes.js';
import { AnyObject } from './interfaces.js';
import { getFirst } from './arrays.js';
import { isFunction } from './functions.js';
import { getTypeOf, isPlainObject } from './deps.js';
import { tryParseJSON } from './json.js';
import * as s from './strings.js';
import { isKey } from './objects.js';

/**
 * A custom Error class with additional properties,
 * like statusCode and fatalError
 */
export class TSError extends Error {
    /**
     * An descriptive error code that specifies the error type, this follows more
     * node convention
     */
    code: string;

    /**
     * A HTTP status code for easy use
     */
    statusCode: number;

    /**
     * Used to indicate the an error is fatal
     */
    fatalError: boolean;

    /**
     * Used sometimes to indicate whether an error is retryable
     *
     * If this is not set then it is better not to assume either way
     */
    retryable?: boolean;

    /**
     * Additional context metadata
     */
    context: TSErrorContext;

    static [Symbol.hasInstance](_instance: unknown): boolean {
        if (_instance == null || typeof _instance !== 'object') return false;
        const instance = _instance as Record<string, unknown>;
        if (instance.message == null || instance.stack == null) return false;
        if (instance.statusCode == null) return false;
        if (typeof instance.getCause !== 'function') return false;
        return true;
    }

    constructor(input: unknown, config: TSErrorConfig = {}) {
        const { fatalError = false } = config;

        const {
            message, statusCode, context, code
        } = parseErrorInfo(input, config);

        super(message);

        this.fatalError = fatalError;
        this.statusCode = statusCode;
        this.context = context;
        this.code = code;

        if (isTSError(input)) {
            this.fatalError = !!input.fatalError;
            this.retryable = input.retryable;
        }

        if (!this.fatalError && config.retryable != null) {
            this.retryable = config.retryable;
        }

        Object.defineProperty(this, 'name', {
            value: this.constructor.name,
        });

        if (Error?.captureStackTrace) {
            Error.captureStackTrace(this, TSError);
        } else {
            const value = Error(message).stack;
            if (value) {
                Object.defineProperty(this, 'stack', {
                    value,
                    writable: true,
                    configurable: true
                });
            }
        }
    }

    getCause(): any {
        return this.context._cause;
    }
}

export interface TSErrorConfig {
    /**
     * An descriptive error code that specifies the error type, this follows more
     * node convention
     */
    code?: string;

    /**
     * A HTTP status code for easy use
     */
    statusCode?: number;

    /**
     * Used to indicate the an error is fatal
     */
    fatalError?: boolean;

    /**
     * Used sometimes to indicate whether an error is retryable
     */
    retryable?: boolean;

    /**
     * Prefix the error message with a reason
     */
    reason?: string;

    /**
     * Override the message when given an error
     */
    message?: string;

    /**
     * Attach any context metadata to the error
     */
    context?: AnyObject;

    defaultStatusCode?: number;
    defaultErrorMsg?: string;
}

export interface TSErrorContext extends AnyObject {
    /** ISO Date string */
    _createdAt: string;
    _cause: any;
    /**
     * Used to indicate the error message is safe to log and send to the user
     */
    safe?: boolean;
}

type ErrorInfo = {
    message: string;
    stack?: string;
    context: TSErrorContext;
    statusCode: number;
    code: string;
};

const DEFAULT_STATUS_CODE = 500;
const DEFAULT_ERR_MSG = STATUS_CODES[DEFAULT_STATUS_CODE] as string;

/**
 * Use following the chain of caused by stack of an error.
 * Don't use this when logging the error, only when sending it
 * */
export function getFullErrorStack(err: unknown): string {
    return `${parseError(err, true)}${getCauseStack(err)}`;
}

function getCauseStack(err: any) {
    if (!err || !isFunction(err.getCause)) return '';
    const cause = err.getCause();
    if (!cause) return '';
    return `\nCaused by: ${getFullErrorStack(cause)}`;
}

/** parse error for info */
export function parseErrorInfo(input: unknown, config: TSErrorConfig = {}): ErrorInfo {
    const { defaultErrorMsg, defaultStatusCode = DEFAULT_STATUS_CODE } = config;

    const statusCode = getErrorStatusCode(input, config, defaultStatusCode);

    if (isElasticsearchError(input)) {
        const esErrorInfo = _parseESErrorInfo(input);
        if (esErrorInfo) {
            const updatedContext = Object.assign({}, esErrorInfo.context, config.context);
            return {
                message: config.message
                    || prefixErrorMsg(
                        esErrorInfo.message,
                        config.reason,
                        defaultErrorMsg
                    ),
                context: createErrorContext(input, { ...config, context: updatedContext }),
                statusCode,
                code: esErrorInfo.code,
            };
        }
    }

    const context = createErrorContext(input, config);

    let stack: string | undefined;
    const message = config.message || prefixErrorMsg(input, config.reason, defaultErrorMsg);

    if (input && (input as any).stack) {
        stack = (input as any).stack;
    }

    let code: string;
    if (config.code && s.isString(config.code)) {
        code = toStatusErrorCode(config.code);
    } else if (input && (input as any).code && s.isString((input as any).code)) {
        code = toStatusErrorCode((input as any).code);
    } else if (isKey(STATUS_CODES, statusCode)) {
        code = toStatusErrorCode(STATUS_CODES[statusCode]);
    } else {
        code = toStatusErrorCode(undefined);
    }

    return {
        stack,
        message,
        context,
        statusCode,
        code,
    };
}

/**
 * Safely log an error (with the error first Logger syntax)
*/
export function logError(logger: Logger, err: unknown, ...messages: any[]): void {
    if (typeof err === 'string') {
        logger.error(new TSError(err), ...messages);
        return;
    }

    if (isError(err)) {
        logger.error(err, ...messages);
        return;
    }

    // make sure we don't lose the stack
    logger.error(new TSError(err), ...messages, `invalid message format ${getTypeOf(err)} error`);
}

function createErrorContext(input: any, config: TSErrorConfig = {}) {
    const context = Object.assign({}, input && input.context, config && config.context);

    Object.defineProperties(context, {
        _createdAt: {
            value: new Date().toISOString(),
            enumerable: false,
        },
        _cause: {
            value: input,
            enumerable: false,
        },
    });

    // don't propogate safe
    if (context.safe && !(config.context && config.context.safe)) {
        context.safe = false;
    }

    return context;
}

/** parse input to get error message or stack */
export function parseError(input: unknown, withStack = false): string {
    const result = parseErrorInfo(input);
    if (withStack && result.stack) return result.stack;
    return result.message;
}

function _cleanErrorMsg(input: string): string {
    return s.truncate(input.trim(), 3000);
}

function _parseESErrorInfo(
    input: ElasticsearchError
): { message: string; context: Record<string, any>; code: string } | null {
    const bodyError = input && input.body && input.body.error;
    const name = (input && input.name) || 'ElasticSearchError';

    const rootCause = bodyError && bodyError.root_cause && getFirst(bodyError.root_cause);

    let type: string | undefined;
    let reason: string | undefined;
    let index: string | undefined;

    [input, bodyError, rootCause].forEach((obj) => {
        if (obj == null) return;
        if (!isPlainObject(obj)) return;
        if (obj.type) type = obj.type;
        if (obj.reason) reason = obj.reason;
        if (obj.index) index = obj.index;
    });

    const metadata = input.toJSON();
    if (metadata.response) {
        const response = tryParseJSON(metadata.response);
        metadata.response = response;
    } else if (input.body) {
        metadata.response = input.body as any;
    }

    if (!index && metadata.response) {
        index = (metadata.response as any).index || (metadata.response as any)._index;
    }

    const message = `Elasticsearch Error: ${_normalizeESError(metadata.msg)}`;

    const code = toStatusErrorCode(reason ? `${name} ${reason}` : name);

    return {
        message,
        context: {
            metadata,
            type,
            reason,
            index,
        },
        code,
    };
}

export function toStatusErrorCode(input: string | undefined): string {
    if (!s.isString(input)) return 'UNKNOWN_ERROR';
    return input
        .trim()
        .toUpperCase()
        .replace(/\W+/g, '_');
}

function _normalizeESError(message?: string) {
    if (!message) return '';

    const msg = message.toLowerCase();

    if (msg.includes('document missing')) {
        return 'Not Found';
    }

    if (msg.includes('document already exists')) {
        return 'Document Already Exists (version conflict)';
    }

    if (msg.includes('version conflict')) {
        return 'Document Out-of-Date (version conflict)';
    }

    if (msg.indexOf('unknown error') === 0) {
        return 'Unknown Elasticsearch Error, Cluster may be Unavailable';
    }

    return message;
}

export function prefixErrorMsg(
    input: unknown, prefix?: string, defaultMsg = 'Unknown Error'
): string {
    if (!prefix) {
        if (isError(input)) {
            return _cleanErrorMsg(input.message || defaultMsg);
        }
        return _cleanErrorMsg(s.toString(input) || defaultMsg);
    }
    return _cleanErrorMsg(`${prefix}, caused by ${s.toString(input || defaultMsg)}`);
}

export function isFatalError(err: unknown): boolean {
    return !!(err && (err as any).fatalError);
}

export function isRetryableError(err: unknown): boolean {
    return !!(err && (err as any).retryable === true && !(err as any).fatalError);
}

/** Check if an input has an error compatible api */
export function isError(err: unknown): err is Error {
    return err && (err as any).stack && (err as any).message;
}

/** Check is a TSError */
export function isTSError(err: unknown): err is TSError {
    if (err instanceof TSError) return true;
    if (!isError(err)) return false;

    return (err as any).statusCode != null;
}

/** Check is a elasticsearch error */
export function isElasticsearchError(err: unknown): err is ElasticsearchError {
    return !!(err && isFunction((err as any).toJSON));
}

export interface ElasticsearchError extends Error {
    body?: {
        error?: {
            type?: string;
            reason?: string;
            index?: string;
            root_cause?: [
                {
                    type?: string;
                    reason?: string;
                    index?: string;
                }
            ];
        };
    };

    status?: number;
    type?: string;
    reason?: string;
    index?: string;

    toJSON(): {
        msg?: string;
        statusCode?: number;
        response?: string;
    };
}

function coerceStatusCode(input: any): number | null {
    return isKey(STATUS_CODES, input) ? input : null;
}

export function getErrorStatusCode(
    err: unknown,
    config: TSErrorConfig = {},
    defaultCode = DEFAULT_STATUS_CODE
): number {
    const metadata = isElasticsearchError(err) ? err.toJSON() : {};

    for (const key of ['statusCode', 'status', 'code']) {
        for (const obj of [config, err, metadata]) {
            if (!obj || s.isString(obj)) continue;

            const statusCode = coerceStatusCode((obj as any)[key]);
            if (statusCode != null) {
                return statusCode;
            }
        }
    }

    return defaultCode;
}

export function stripErrorMessage(
    error: unknown,
    reason: string = DEFAULT_ERR_MSG,
    requireSafe = false
): string {
    const { message, context, statusCode } = parseErrorInfo(error, {
        defaultErrorMsg: reason,
        context: error && (error as any).context,
    });
    const messages = s.parseList(message.split('caused by'));

    const firstErr = getFirst(messages);
    if (!firstErr) return reason;

    const msg = firstErr
        .replace(/^\s*,\s*/, '')
        .replace(/\s*,\s*$/, '')
        .replace(/TSError/g, 'Error')
        .trim();

    if (requireSafe) {
        if (context && context.safe) return msg;
        if (statusCode === 403) return 'Access Denied';
        if (statusCode === 404) return 'Not Found';
        return reason;
    }

    if (firstErr.includes(reason)) return msg;
    return `${reason}: ${msg}`;
}

/**
 * Formats an AggregateError into a user-friendly Error which shows the first five Errors from the Aggregate.
 * @param aggregateError
 */
export async function formatAggregateError(aggregateError: unknown) {
    // Check to ensure it's an aggregate error with an errors key that's an array
    if (aggregateError instanceof AggregateError && Array.isArray(aggregateError.errors)) {
        // This will ensure we don't print more than 5 errors
        const maxErrorLength = 5;
        const errorPrintLength
                    = aggregateError.errors.length < maxErrorLength
                        ? aggregateError.errors.length
                        : maxErrorLength;

        let message = `Failed with an AggregateError containing ${aggregateError.errors.length} error(s):\n`;

        for (let i = 0; i < errorPrintLength; i++) {
            const error = aggregateError.errors[i];
            // ensure this is also an instance of an error so it has a message property
            let text: string;
            if (error instanceof Error) {
                text = error.message;
            } else {
                try {
                    text = JSON.stringify(error);
                } catch (innerError) {
                    text = String(error);
                }
            }
            message += `\n[${i + 1}] ${text}`;
        }
        if (aggregateError.errors.length > maxErrorLength) {
            const remainingErrors = aggregateError.errors.length - maxErrorLength;
            message += `\n... and ${remainingErrors} other errors.`;
        }

        const combinedError = new Error(message);
        throw combinedError;
    }

    throw aggregateError;
}
