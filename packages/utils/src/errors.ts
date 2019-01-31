import * as utils from './utils';
import { STATUS_CODES } from 'http';

/**
 * A custom Error class with additional properties,
 * like statusCode and fatalError
*/
export class TSError extends Error {
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

    constructor (input: any, config: TSErrorConfig = {}) {
        const { fatalError = false } = config;

        const {
            message,
            statusCode,
            context,
            stack
        } = parseErrorInfo(input, config);

        super(message);

        if (isTSError(input)) {
            this.fatalError = !!input.fatalError;
            this.retryable = input.retryable;
        }

        this.fatalError = fatalError;
        this.statusCode = statusCode;
        this.context = context;

        if (!this.fatalError && config.retryable != null) {
            this.retryable = config.retryable;
        }

        this.name = this.constructor.name;
        if (stack) {
            this.stack = this.stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export interface TSErrorConfig {
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
     * Attach any context metadata to the error
    */
    context?: object;

    /**
     * If an error is passed in the stack will be preserved
    */
    withStack?: boolean;
}

export interface TSErrorContext extends Object {
    /** ISO Date string */
    _createdAt: string;
    _cause: any;
}

export function isFatalError(err: any): boolean {
    return !!(err && err.fatalError);
}

export function isRetryableError(err: any): boolean {
    return !!(err && err.retryable === true && !err.fatalError);
}

type ErrorInfo = { message: string, stack?: string, context: TSErrorContext, statusCode: number };

/** parse error for info */
export function parseErrorInfo(input: any, config: TSErrorConfig = {}): ErrorInfo {
    const inputContext = (input && input.context) || {};

    const context = Object.assign({}, inputContext, config.context, {
        _createdAt: new Date().toISOString(),
        _cause: input,
    });

    const statusCode = getErrorStatusCode(input, config);

    if (isElasticsearchError(input)) {
        const esErrorInfo = _parseESErrorInfo(input);
        if (esErrorInfo) {
            return {
                message: prefixErrorMsg(esErrorInfo.message, config.reason),
                context: Object.assign({}, esErrorInfo.context, context),
                statusCode,
            };
        }
    }

    let stack: string|undefined;
    const message = prefixErrorMsg(input, config.reason);

    if (config.withStack && input.stack) {
        const oldTitle = utils.toString(input);
        const newTitle = `Error: ${message}`;
        stack = input.stack.replace(oldTitle, newTitle);
    }

    return {
        stack,
        message,
        context,
        statusCode,
    };
}

/** parse input to get error message or stack */
export function parseError(input: any, withStack = false): string {
    const result = parseErrorInfo(input, { withStack });
    if (result.stack) return result.stack;
    return result.message;
}

function _cleanErrorMsg(input: string): string {
    return utils.truncate(input.trim(), 3000);
}

function _parseESErrorInfo(input: ElasticsearchError): { message: string, context: object }|null {
    const bodyError = input && input.body && input.body.error;

    const rootCause = bodyError
        && bodyError.root_cause
        && utils.getFirst(bodyError.root_cause);

    let type: string|undefined;
    let reason: string|undefined;
    let index: string|undefined;

    [input, bodyError, rootCause]
        .forEach((obj) => {
            if (obj == null) return;
            if (!utils.isPlainObject(obj)) return;
            if (obj.type) type = obj.type;
            if (obj.reason) reason = obj.reason;
            if (obj.index) index = obj.index;
        });

    const metadata = input.toJSON();
    if (metadata.response) {
        const response = utils.tryParseJSON(metadata.response);
        metadata.response = response;
        if (!index && response && response._index) {
            index = response._index;
        }
    }

    let message = `Elasticsearch Error: ${_normalizeESError(metadata.msg)}`;

    if (type) message += ` type: ${type}`;
    if (reason) message += ` reason: ${reason}`;
    if (index) message += ` on index: ${index}`;

    return {
        message,
        context: {
            metadata,
            type,
            reason,
            index,
        },
    };
}

function _normalizeESError(message?: string) {
    if (!message) return '';

    if (message.includes('document missing')) {
        return 'Not Found';
    }

    if (message.includes('document already exists')) {
        return 'Document Already Exists (version conflict)';
    }

    if (message.indexOf('unknown error') === 0) {
        return 'Unknown Elasticsearch Error, Cluster may be Unavailable';
    }

    return message;
}

export function prefixErrorMsg(input: any, prefix?: string) {
    const defaultMsg = 'Unknown Error';
    if (!prefix) {
        if (isError(input)) {
            return _cleanErrorMsg(input.message || defaultMsg);
        }
        return _cleanErrorMsg(utils.toString(input) || defaultMsg);
    }
    return _cleanErrorMsg(`${prefix}, caused by ${utils.toString(input || defaultMsg)}`);
}

/** Check if an input has an error compatible api */
export function isError(err: any): err is Error {
    return err && err.stack && err.message;
}

/** Check is a TSError */
export function isTSError(err: any): err is TSError {
    if (err instanceof TSError) return true;
    if (!isError(err)) return false;

    // @ts-ignore
    return err.statusCode != null;
}

/** Check is a elasticsearch error */
export function isElasticsearchError(err: any): err is ElasticsearchError {
    return err && utils.isFunction(err.toJSON);
}

export interface ElasticsearchError extends Error {
    body?: {
        error?: {
            type?: string,
            reason?: string,
            index?: string
            root_cause?: [{
                type?: string,
                reason?: string,
                index?: string
            }]
        }
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

function coerceStatusCode(input: any): number|null {
    return STATUS_CODES[input] != null ? input : null;
}

export function getErrorStatusCode(err: any, config: TSErrorConfig = {}): number {
    const metadata = isElasticsearchError(err) ? err.toJSON() : {};

    for (const key of ['statusCode', 'status', 'code']) {
        for (const obj of [config, err, metadata]) {
            if (!obj || utils.isString(obj)) continue;

            const statusCode = coerceStatusCode(obj[key]);
            if (statusCode != null) {
                return statusCode;
            }
        }
    }

    return 500;
}
