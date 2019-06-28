import { IndexModelConfig, IndexModelRecord, CreateRecordInput, UpdateRecordInput } from 'elasticsearch-store';

/**
 * A fixed permission level type system, used for primarly metadata management.
 *
 * Available Types:
 * - `SUPERADMIN`: This type is multi-tenate and read/write everything.
 * - `ADMIN`: This type is single-tenate and can read/write most things.
 * - `DATAADMIN`: This type is single-tenate and read/write Spaces and DataTypes.
 * - `USER`: This type is single-tenate and can only read/write things it has direct permission to.
 */
export type UserType = 'SUPERADMIN' | 'ADMIN' | 'DATAADMIN' | 'USER';
export const UserTypes: ReadonlyArray<UserType> = ['SUPERADMIN', 'ADMIN', 'DATAADMIN', 'USER'];

const config: IndexModelConfig<User> = {
    version: 1,
    name: 'users',
    mapping: {
        properties: {
            client_id: {
                type: 'integer',
            },
            firstname: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer',
                    },
                },
            },
            lastname: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer',
                    },
                },
            },
            username: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer',
                    },
                },
            },
            email: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer',
                    },
                },
            },
            type: {
                type: 'keyword',
            },
            api_token: {
                type: 'keyword',
            },
            hash: {
                type: 'keyword',
            },
            salt: {
                type: 'keyword',
            },
            role: {
                type: 'keyword',
            },
        },
    },
    schema: {
        properties: {
            client_id: {
                type: 'number',
                multipleOf: 1.0,
                minimum: 0,
            },
            username: {
                type: 'string',
            },
            firstname: {
                type: 'string',
            },
            lastname: {
                type: 'string',
            },
            email: {
                format: 'email',
            },
            role: {
                type: 'string',
            },
            type: {
                type: 'string',
                default: 'USER',
                enum: UserTypes,
            },
            api_token: {
                type: 'string',
            },
            hash: {
                type: 'string',
            },
            salt: {
                type: 'string',
            },
        },
        required: ['client_id', 'username', 'firstname', 'lastname'],
    },
    uniqueFields: ['username', 'api_token'],
    sanitizeFields: {
        email: 'trimAndToLower',
        username: 'trim',
    },
    strictMode: false,
};

/**
 * The definition of a User model
 */
export interface User extends IndexModelRecord {
    /**
     * The mutli-tenant ID representing the client
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
    email?: string;

    /**
     * The users attached role
     */
    role?: string;

    /**
     * This used to provide compatibility with legacy roles
     *
     * **IMPORTANT** Avoid depending on this field since it is subject to change
     */
    role_name?: string;

    /**
     * A fixed permission level type system, used for primarly metadata management.
     *
     * @see {UserType}
     * @default "USER"
     */
    type?: UserType;

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

export type CreateUserInput = Omit<CreateRecordInput<User>, 'api_token' | 'hash' | 'salt'>;
export type UpdateUserInput = Omit<UpdateRecordInput<User>, 'api_token' | 'hash' | 'salt'>;

export default config;
