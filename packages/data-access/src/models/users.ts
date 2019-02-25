import * as es from 'elasticsearch';
import { Omit, Optional, DataEntity } from '@terascope/utils';
import usersConfig from './config/users';
import { Base, BaseModel, FieldMap } from './base';
import { ManagerConfig } from '../interfaces';
import * as utils from '../utils';

/**
 * Manager for Users
 *
 * @todo handle backwards compatiblity with "role"
*/
export class Users extends Base<PrivateUserModel, CreatePrivateUserInput, UpdatePrivateUserInput> {
    static PrivateFields: string[] = ['api_token', 'salt', 'hash'];
    static ModelConfig = usersConfig;
    static GraphQLSchema = `
        type User {
            id: ID!
            client_id: Int
            username: String!
            firstname: String
            lastname: String
            email: String
            roles: [String]
            api_token: String
            hash: String
            salt: String
            created: String
            updated: String
        }

        type PublicUser {
            id: ID!
            client_id: Int
            username: String!
            firstname: String
            lastname: String
            email: String
            roles: [String]
            created: String
            updated: String
        }

        input CreateUserInput {
            client_id: Int!
            username: String!
            firstname: String
            lastname: String
            email: String
            roles: [String]
        }

        input UpdateUserInput {
            id: ID!
            client_id: Int
            username: String
            firstname: String
            lastname: String
            email: String
            roles: [String]
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

    async updateWithPassword(id: string, password: string) {
        const record = await super.findByAnyId(id);
        const salt = await utils.generateSalt();
        const hash = await utils.generatePasswordHash(password, salt);
        const apiToken = await utils.generateAPIToken(hash, record.username);

        return super.update({
            ...record,
            api_token: apiToken,
            hash,
            salt,
        });
    }

    /**
     * Authenticate the user
     *
     * @returns an array with first value being a boolean to indicate if authenticated.
     *          if the first value is true, the second value will be user with all of the private fields
     *          else the second value is empty
    */
    async authenticate(username: string, password: string): Promise<[boolean, PrivateUserModel?]> {
        const user = await super.findBy({ username });
        if (!user) return [false];

        const hash = await utils.generatePasswordHash(password, user.salt);
        const authenticated = user.hash === hash;
        if (authenticated) {
            return [true, user];
        }

        return [false];
    }

    /**
     * Update the API Token for a user
    */
    async updateToken(username: string): Promise<string> {
        const user = await super.findByAnyId(username);
        user.api_token = await utils.generateAPIToken(user.hash, username);

        await super.update(user);
        return user.api_token;
    }

    /**
     * Find user by token, returns private fields
     */
    // @ts-ignore
    async findByToken(apiToken: string): Promise<PrivateUserModel> {
        const result = await super.findBy({ api_token: apiToken });
        return result;
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
    async findBy(fields: FieldMap<PrivateUserModel>, joinBy = 'AND'): Promise<UserModel> {
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
        const users = await this.find(`roles: ${roleId}`);
        const promises = users.map(async ({ id }) => {
            try {
                await this.removeFromArray(id, 'roles', roleId);
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
export interface UserModel extends BaseModel {
/**
     * The ID for the client
    */
    client_id: number;

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
     * A list of all of its associated Roles
     *
     * Currently Roles will be restricted to an array of one
    */
    roles: [string]|[];
}

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

export type CreateUserInput = Omit<UserModel, (keyof BaseModel)>;
export type CreatePrivateUserInput = Omit<PrivateUserModel, (keyof BaseModel)>;

export type UpdateUserInput = Optional<UserModel, Exclude<(keyof BaseModel), 'id'>>;
export type UpdatePrivateUserInput = Optional<PrivateUserModel, Exclude<(keyof BaseModel), 'id'>>;
