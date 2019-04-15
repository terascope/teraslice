import { Request } from 'express';
import { ACLManager, User } from '@terascope/data-access';

export interface ManagerContext {
    manager: ACLManager;
    user: User|false;
    req: Request;
}
