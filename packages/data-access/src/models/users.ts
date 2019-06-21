import * as es from 'elasticsearch';
import * as store from 'elasticsearch-store';
import { TSError, Omit } from '@terascope/utils';
import usersConfig, { User, UserType } from './config/users';
import * as utils from '../utils';

/**
 * Manager for Users
 */
export class Users extends store.IndexModel<User> {
    static PrivateFields: string[] = ['api_token', 'salt', 'hash'];
    static IndexModelConfig = usersConfig;

    constructor(client: es.Client, options: store.IndexModelOptions) {
        super(client, options, usersConfig);
    }

    /**
     * Create user with password, returns private fields
     */
    async createWithPassword(record: CreateUserInput, password: string): Promise<User> {
        const salt = await utils.generateSalt();
        const hash = await utils.generatePasswordHash(password, salt);
        const apiToken = await utils.generateAPIToken(hash, record.username);

        return super.create({
            ...record,
            api_token: apiToken,
            hash,
            salt,
        });
    }

    async updatePassword(id: string, password: string) {
        const record = await super.findByAnyId(id);
        const salt = await utils.generateSalt();
        const hash = await utils.generatePasswordHash(password, salt);

        return super.update({
            id: record.id,
            hash,
            salt,
        });
    }

    /**
     * Authenticate the user
     */
    async authenticate(username: string, password: string): Promise<User> {
        let user: User;

        try {
            user = await super.findBy({ username });
        } catch (err) {
            if (err && err.statusCode === 404) {
                throw new TSError('Unable to authenticate user', {
                    statusCode: 403,
                });
            }

            throw err;
        }

        const hash = await utils.generatePasswordHash(password, user.salt);

        if (user.hash !== hash) {
            throw new TSError('Unable to authenticate user with credentials', {
                statusCode: 403,
            });
        }

        return user;
    }

    /**
     * Update the API Token for a user
     */
    async updateToken(id: string): Promise<string> {
        const user = await super.findByAnyId(id);
        const apiToken = await utils.generateAPIToken(user.hash, user.username);

        await super.update({
            id: user.id,
            api_token: apiToken,
        });

        return apiToken;
    }

    /**
     * Authenticate user by api token, returns private fields
     */
    async authenticateWithToken(apiToken?: string): Promise<User> {
        if (!apiToken) {
            throw new TSError('Missing api_token for authentication', {
                statusCode: 401,
            });
        }

        if (!(apiToken.match(/^[a-fA-F0-9_]*$/) && apiToken.length === 40)) {
            throw new TSError('Unable to authenticate user with api token', {
                statusCode: 403,
            });
        }

        try {
            return await super.findBy({ api_token: apiToken });
        } catch (err) {
            if (err && err.statusCode === 404) {
                throw new TSError('Unable to authenticate user with api token', {
                    statusCode: 403,
                });
            }

            throw err;
        }
    }

    isPrivateUser(user: Partial<User>): boolean {
        if (!user) return false;

        const fields = Object.keys(user);
        return Users.PrivateFields.some(field => {
            return fields.includes(field);
        });
    }

    async removeRoleFromUsers(roleId: string) {
        const users = await this.find(`role: ${roleId}`);
        const promises = users.map(async ({ id }) => {
            try {
                await this.update({
                    id,
                    role: '',
                });
            } catch (err) {
                if (err && err.statusCode === 404) {
                    return;
                }
                throw err;
            }
        });
        await Promise.all(promises);
    }
}

type CreateUserInput = Omit<store.CreateRecordInput<User>, 'api_token' | 'hash' | 'salt'>;
type UpdateUserInput = Omit<store.UpdateRecordInput<User>, 'api_token' | 'hash' | 'salt'>;
export { User, UserType, CreateUserInput, UpdateUserInput };
