import { ModelFactory, BaseModel, UpdateInput } from './base';

/**
 * Manager for Users
*/
export class Users extends ModelFactory<UserModel> {
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
    async findByToken(apiToken: string): Promise<UserModel> {
        // @ts-ignore FIXME
        return {};
    }

    /**
     * Find a User by username
    */
    async findByUsername(username: string): Promise<UserModel> {
        // @ts-ignore FIXME
        return {};
    }
}

/**
 * The definition of a User model
*/
export interface UserModel extends BaseModel {
    /**
     * First Name of the User
    */
    firstname: string;

    /**
     * Last Name of the User
    */
    lastname: string;

    /**
     * The User's username
    */
    username: string;

    /**
     * The User's email address
    */
    email: string;

    /**
     * A list of all of its associated Roles
    */
    roles: string[];
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
     * `crypto.randomBytesAsync(32)`
    */
    salt: string;
}
