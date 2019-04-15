import get from 'lodash.get';
import set from 'lodash.set';
import { Request } from 'express';
import { User, ACLManager } from '@terascope/data-access';
import * as apollo from 'apollo-server-express';
import { parseErrorInfo, trim } from '@terascope/utils';

export function formatError(err: any) {
    if (err && err.extensions != null) return err;

    const { statusCode, message, code } = parseErrorInfo(err);

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
        set(req, '_passport.session.user', user);
        set(req, 'session.passport', user);
    }
    set(req, 'user', user);
}

export function getLoggedInUser(req: Request): User|null {
    const user = get(req, 'user', get(req, 'session.passport'));
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
    const queryToken: string = get(req, 'query.token');
    if (queryToken) return { token: queryToken } ;

    const authToken: string = get(req, 'headers.authorization');
    if (!authToken) return { };

    let [part1, part2] = authToken.split(' ');
    part1 = trim(part1);
    part2 = trim(part2);

    if (part1 === 'Token') {
        return { token: trim(part2) };
    }

    if (part1 === 'Basic') {
        const parsed = Buffer.from(part2, 'base64').toString('utf8');
        const [username, password] = parsed.split(':');
        return { username, password };
    }

    return {};
}
