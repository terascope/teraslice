import { Request } from 'express';
import { Logger } from '@terascope/utils';
import { AuthUser } from '@terascope/data-access';

export interface SpacesContext {
    user: AuthUser;
    req: Request;
    authenticating: boolean;
    logger: Logger;
}
