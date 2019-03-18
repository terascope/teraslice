import * as es from 'elasticsearch';
import {  DataEntity, TSError } from '@terascope/utils';
import usersConfig from './config/users';
import { ManagerConfig } from '../interfaces';
import * as base from './base';
import * as utils from '../utils';

/**
 * Manager for Users
*/
export class Users extends base.Base<PrivateUserModel, CreatePrivateUserInput, UpdatePrivateUserInput> {
    static PrivateFields: string[] = ['api_token', 'salt', 'hash'];
    static ModelConfig = usersConfig;
    static GraphQLSchema = `
        enum UserType {
            USER
            ADMIN
            SUPERADMIN
        }

        type User {
            id: ID!
            client_id: Int
            username: String!
            firstname: String
            lastname: String
            email: String
            role: String
            type: UserType
            api_token: String
            hash: String
            salt: String
            created: String
            updated: String
        }

        input CreateUserInput {
            client_id: Int
            username: String!
            firstname: String
            lastname: String
            email: String
            type: UserType
            role: String
        }

        input UpdateUserInput {
            id: ID!
            client_id: Int
            username: String
            firstname: String
            lastname: String
            email: String
            type: UserType
            role: String
        }
    `;

    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, usersConfig);
    }

    /**
     * Create user with password, returns private fields
     */
    async createWithPassword(record: CreateUserInput, password: string): Promise<PrivateUserModel> {
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
    async authenticate(username: string, password: string): Promise<PrivateUserModel> {
        let user: PrivateUserModel;

        try {
            user = await super.findBy({ username });
        } catch (err) {
            if (err && err.statusCode === 404) {
                throw new TSError('Unable to authenticate user', {
                    statusCode: 403
                });
            }

            throw err;
        }

        const hash = await utils.generatePasswordHash(password, user.salt);

        if (user.hash !== hash) {
            throw new TSError('Unable to authenticate user with credentials', {
                statusCode: 403
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
            api_token: apiToken
        });

        return apiToken;
    }

    /**
     * Authenticate user by api token, returns private fields
     */
    async authenticateWithToken(apiToken?: string): Promise<PrivateUserModel> {
        if (!apiToken) {
            throw new TSError('Missing api_token for authentication', {
                statusCode: 401
            });
        }

        try {
            return await super.findBy({ api_token: apiToken });
        } catch (err) {
            if (err && err.statusCode === 404) {
                throw new TSError('Unable to authenticate user with api token', {
                    statusCode: 403
                });
            }

            throw err;
        }
    }

    /**
     * Find users, returns public user fields
     */
    // @ts-ignore
    async find(q: string = '*', size: number = 10, fields?: (keyof UserModel)[], sort?: string): Promise<UserModel[]> {
        const users = await super.find(q, size, fields, sort);
        return users.map((user) => this.omitPrivateFields(user));
    }

    /**
     * Find user by id, returns public user fields
     */
    // @ts-ignore
    async findById(id: string): Promise<UserModel> {
        const user = await super.findById(id);
        return this.omitPrivateFields(user);
    }

    /**
     * Find user by any id, returns public user fields
     */
    // @ts-ignore
    async findByAnyId(id: string): Promise<UserModel> {
        const user = await super.findByAnyId(id);
        return this.omitPrivateFields(user);
    }

    /**
     * Find user by any id, returns public user fields
     */
    // @ts-ignore
    async findBy(fields: base.FieldMap<PrivateUserModel>, joinBy = 'AND'): Promise<UserModel> {
        const user = await super.findBy(fields, joinBy);
        return this.omitPrivateFields(user);
    }

    /**
     * Find multiple users by id, returns public user fields
     */
    // @ts-ignore
    async findAll(ids: string[]): Promise<UserModel[]> {
        const users = await super.findAll(ids);
        return users.map((user) => this.omitPrivateFields(user));
    }

    isPrivateUser(user: Partial<PrivateUserModel>): user is PrivateUserModel  {
        if (!user) return false;

        const fields = Object.keys(user);
        return Users.PrivateFields.some((field) => {
            return fields.includes(field);
        });
    }

    omitPrivateFields(user: PrivateUserModel|UserModel): UserModel {
        if (!this.isPrivateUser(user)) return user;

        const publicUser = {};
        const privateFields = Users.PrivateFields;

        for (const [key, val] of Object.entries(user)) {
            if (!privateFields.includes(key)) {
                publicUser[key] = val;
            }
        }

        // @ts-ignore
        return DataEntity.make(publicUser, DataEntity.getMetadata(user));
    }

    async removeRoleFromUsers(roleId: string) {
        const users = await this.find(`role: ${roleId}`);
        const promises = users.map(async ({ id }) => {
            try {
                await this.update({
                    id,
                    role: ''
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

/**
 * The definition of a User model
*/
export interface UserModel extends base.BaseModel {
    /**
     * The ID for the client
    */
    client_id?: number;

    /**
     * The User's username
    */
    username: string;

    /**
     * First Name of the User
    */
    firstname: string;

    /**
     * Last Name of the User
    */
    lastname: string;

    /**
     * The User's email address
    */
    email: string;

    /**
     * The users attached role
    */
    role?: string;

    /**
     * The user's type
     *
     * @default "User"
    */
    type?: UserType;
}

export type UserType = 'SUPERADMIN'|'ADMIN'|'USER';

export interface PrivateUserModel extends UserModel {
    /**
     * The User's API Token
    */
    api_token: string;

    /**
     * A hash password using:
     *
     * ```js
     * const rawHash = await crypto.pbkdf2Async(user.hash, user.salt, 25000, 512, 'sha1')
     * return Buffer.from(rawHash, 'binary').toString('hex');
     * ```
    */
    hash: string;

    /**
     * A unique salt for the password
     *
     * `crypto.randomBytesAsync(32).toString('hex')`
    */
    salt: string;
}

export type CreateUserInput = base.CreateModel<UserModel>;
export type CreatePrivateUserInput = base.CreateModel<PrivateUserModel>;

export type UpdateUserInput = base.UpdateModel<UserModel>;
export type UpdatePrivateUserInput = base.UpdateModel<PrivateUserModel>;
