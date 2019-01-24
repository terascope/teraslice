import { getFirst } from '@terascope/utils';
import * as es from 'elasticsearch';
import * as usersConfig from './mapping/users';
import { Base, UpdateInput, BaseModel } from './base';
import { ManagerConfig } from '../interfaces';

/**
 * Manager for Users
*/
export class Users extends Base<UserModel> {
    constructor(client: es.Client, config: ManagerConfig) {
        super(client, config, usersConfig);
    }

    /**
     * Authenticate the user
     *
     * @returns true if authenticated and false if it fails to authenticate the user
    */
    async authenticate(username: string, password: string): Promise<boolean> {
        // @ts-ignore FIXME
        return {};
    }

    /**
     * Update the API Token for a user
    */
    async updateToken(user: UpdateInput<UserModel>): Promise<string> {
        return '';
    }

    /**
     * Find a user by the API Token
    */
    async findByToken(apiToken: string) {
        const result = await this.find(`api_token:"${apiToken}"`, 1);
        return getFirst(result);
    }

    /**
     * Find a User by username
    */
    async findByUsername(username: string) {
        const result = await this.find(`username:"${username}"`, 1);
        return getFirst(result);
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
    roles: [string];
}

/**
 * The private fields of the User Model
*/
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
