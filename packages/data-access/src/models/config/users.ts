import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';

const config: IndexModelConfig<User> = {
    version: 1,
    name: 'users',
    mapping: {
        properties: {
            client_id: {
                type: 'integer'
            },
            firstname: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer'
                    }
                }
            },
            lastname: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer'
                    }
                }
            },
            username: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer'
                    }
                }
            },
            email: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer'
                    }
                }
            },
            type: {
                type: 'keyword',
            },
            api_token: {
                type: 'keyword'
            },
            hash: {
                type: 'keyword'
            },
            salt: {
                type: 'keyword'
            },
            role: {
                type: 'keyword'
            }
        }
    },
    schema: {
        properties: {
            client_id: {
                type: 'number',
                multipleOf: 1.0,
                minimum: 0,
            },
            username: {
                type: 'string'
            },
            firstname: {
                type: 'string'
            },
            lastname: {
                type: 'string'
            },
            email: {
                format: 'email'
            },
            role: {
                type: 'string'
            },
            type: {
                type: 'string',
                default: 'USER',
                enum: [
                    'USER',
                    'ADMIN',
                    'SUPERADMIN'
                ]
            },
            api_token: {
                type: 'string'
            },
            hash: {
                type: 'string'
            },
            salt: {
                type: 'string'
            }
        },
        required: [
            'client_id',
            'username',
            'firstname',
            'lastname',
        ]
    },
    uniqueFields: ['username', 'api_token'],
    sanitizeFields: {
        email: 'trimAndToLower',
        username: 'trim',
    },
    strictMode: false,
};

export const GraphQLSchema = `
    enum UserType {
        USER
        ADMIN
        SUPERADMIN
    }

    type User {
        client_id: Int!
        id: ID!
        username: String!
        firstname: String!
        lastname: String!
        email: String
        role: String
        type: UserType
        api_token: String
        created: String
        updated: String
    }

    input CreateUserInput {
        client_id: Int
        username: String!
        firstname: String!
        lastname: String!
        email: String
        type: UserType
        role: String
    }

    input UpdateUserInput {
        client_id: Int
        id: ID!
        username: String
        firstname: String
        lastname: String
        email: String
        type: UserType
        role: String
    }
`;

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

export type UserType = 'SUPERADMIN'|'ADMIN'|'USER';

export default config;
