import get from 'lodash.get';
import { Request } from 'express';

export function getFromReq(req: Request, prop: string, defaultVal?: any): string {
    return get(req, ['body', prop], get(req, ['query', prop], defaultVal));
}
