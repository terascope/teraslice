import get from 'lodash.get';
import { Request } from 'express';

export function getFromReq(req: Request, prop: string, defaultVal?: any): any {
    return get(req, ['query', prop], get(req, ['body', prop], defaultVal));
}

export function getFromQuery(req: Request, prop: string, defaultVal?: any): any {
    return get(req, ['query', prop], defaultVal);
}
