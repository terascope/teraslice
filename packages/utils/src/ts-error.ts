import { STATUS_CODES } from 'http';

/**
 * A custom Error class with additional properties,
 * like statusCode and fatalError
*/
export class TSError extends Error {
    statusCode: number;
    fatalError: boolean;

    constructor (message: string, { statusCode = 500, fatalError = false } = {}) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);

        this.statusCode = STATUS_CODES[statusCode] != null ? statusCode : 500;
        this.fatalError = fatalError;
    }
}
