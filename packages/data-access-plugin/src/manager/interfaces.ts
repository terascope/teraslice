import { Request } from 'express';
import { Logger } from '@terascope/utils';
import { ACLManager, AuthUser } from '@terascope/data-access';

export interface ManagerContext {
    manager: ACLManager;
    user: AuthUser;
    req: Request;
    authenticating: boolean;
    logger: Logger;
    login: () => Promise<void>;
}
