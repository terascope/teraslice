import * as es from 'elasticsearch';
import { getFirst, Omit, DataEntity, Optional } from '@terascope/utils';
import * as usersConfig from './config/users';
import { Base, BaseModel } from './base';
import { ManagerConfig } from '../interfaces';
import * as utils from '../utils';

/**
 * Manager for Users
 *
 * @todo handle backwards compatiblity with "role"
*/
export class Users extends Base<PrivateUserModel, CreatePrivateUserInput, UpdatePrivateUserInput> {
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
        const record = await this.findByAnyId(id);
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
     * @returns true if authenticated and false if it fails to authenticate the user
    */
    async authenticate(username: string, password: string): Promise<boolean> {
        const user = getFirst(await this.find(`username:"${username}"`, 1));
        if (!user) return false;

        const hash = await utils.generatePasswordHash(password, user.salt);
        return user.hash === hash;
    }

    /**
     * Update the API Token for a user
    */
    async updateToken(username: string): Promise<string> {
        const user = await this.findByAnyId(username);
        user.api_token = await utils.generateAPIToken(user.hash, username);

        await super.update(user);
        return user.api_token;
    }

    /**
     * Find a user by the API Token
    */
    async findByToken(apiToken: string) {
        return this.findBy({ api_token: apiToken });
    }

    /**
     * Find a User by username
    */
    async findByUsername(username: string): Promise<DataEntity<PrivateUserModel>> {
        return this.findBy({ username });
    }

    omitPrivateFields(user: DataEntity<PrivateUserModel>): DataEntity<UserModel>;
    omitPrivateFields(user: PrivateUserModel): UserModel;
    omitPrivateFields(user: DataEntity<PrivateUserModel>|PrivateUserModel): DataEntity<UserModel>|UserModel {
        const publicUser = {};
        const privateFields = ['api_token', 'hash', 'salt'];

        for (const [key, val] of Object.entries(user)) {
            if (!privateFields.includes(key)) {
                publicUser[key] = val;
            }
        }

        // @ts-ignore
        return publicUser;
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
