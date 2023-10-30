import { Request, Response } from 'express';
import { Logger } from '@terascope/utils';

export interface TerasliceRequest extends Request {
    logger: Logger
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TerasliceResponse extends Response {}
