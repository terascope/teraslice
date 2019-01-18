/**
 * Manager for Users
*/
export class Users {

}

/**
 * The definition of a User model
*/
export interface UserModel {
    /**
     * A 10 digit ID for the User
     *
     * Something similar to:
     *
     * ```js
     * return crypto.createHash('sha1')
     *   .update(`${Math.random()}${Date.now()}${user.username}${user.hash}`)
     *   .digest('hex')
     *   .slice(0, 10);
     * ```
    */
    id: string;

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

    /**
     * A list of all of its associated Roles
    */
    roles: string[];

    /** Updated date */
    updated: Date;

    /** Creation date */
    created: Date;
}
