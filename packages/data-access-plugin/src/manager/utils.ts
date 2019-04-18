import { Request } from 'express';
import * as ts from '@terascope/utils';
import * as apollo from 'apollo-server-express';
import { User, ACLManager, ModelName, AnyModel } from '@terascope/data-access';

export function forEachModel(fn: (model: ModelName) => void) {
    const models: ModelName[] = ['User', 'Role', 'DataType', 'Space', 'View'];
    return models.forEach((model) => fn(model));
}

export function formatError(err: any) {
    if (err && err.extensions != null) return err;

    const { statusCode, message, code } = ts.parseErrorInfo(err);

    let error: any;

    if (statusCode >= 400 && statusCode < 500) {
        if (statusCode === 422) {
            error = new apollo.ValidationError(message);
        } else if (statusCode === 401) {
            error = new apollo.AuthenticationError(message);
        } else if (statusCode === 403) {
            error = new apollo.ForbiddenError(message);
        } else {
            error = new apollo.UserInputError(message);
        }

        if (err && err.stack) error.stack = err.stack;
    } else {
        error = apollo.toApolloError(err, code);
    }

    return error;
}

export function setLoggedInUser(req: Request, user: User, storeInSession = true): void {
    if (storeInSession) {
        ts.set(req, '_passport.session.user', user);
        ts.set(req, 'session.passport', user);
    }
    ts.set(req, 'user', user);
}

export function getLoggedInUser(req: Request): User|null {
    const user = ts.get(req, 'user', ts.get(req, 'session.passport'));
    // the user must be the latest type
    if (user && user.type && user.id) {
        return user;
    }
    return null;
}

export async function login(manager: ACLManager, req: Request, storeInSession = true): Promise<User> {
    const loggedInUser = getLoggedInUser(req);
    if (loggedInUser) return loggedInUser;

    const creds = getCredentialsFromReq(req);

    const user = await manager.authenticate(creds);
    setLoggedInUser(req, user, storeInSession);
    return user;
}

export function getCredentialsFromReq(req: Request): { token?: string, username?: string, password?: string } {
    const queryToken: string = ts.get(req, 'query.token');
    if (queryToken) return { token: queryToken } ;

    const authToken: string = ts.get(req, 'headers.authorization');
    if (!authToken) return { };

    let [part1, part2] = authToken.split(' ');
    part1 = ts.trim(part1);
    part2 = ts.trim(part2);

    if (part1 === 'Token') {
        return { token: ts.trim(part2) };
    }

    if (part1 === 'Basic') {
        const parsed = Buffer.from(part2, 'base64').toString('utf8');
        const [username, password] = parsed.split(':');
        return { username, password };
    }

    return {};
}

export async function findAll<T extends AnyModel>(ids: string[]|undefined, fn: (query: string) => Promise<T[]>): Promise<T[]> {
    const _ids = ts.castArray(ids || []).filter((id) => !!id);
    if (!_ids.length) return [];

    const query = `id: (${_ids.join(' OR ')})`;
    return fn(query);
}
