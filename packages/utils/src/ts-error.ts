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

    constructor (message: string, config: TSErrorConfig = {}) {
        const {
            statusCode = 500,
            fatalError = false
        } = config;

        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);

        this.statusCode = STATUS_CODES[statusCode] != null ? statusCode : 500;
        this.fatalError = fatalError;

        if (config.retryable != null) {
            this.retryable = config.retryable;
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
}

export function isFatalError(err: any): boolean {
    return err && err.isFatalError;
}

export function isRetryableError(err: any): boolean {
    return err && err.retryable === true;
}
