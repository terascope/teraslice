import { ModelConfig } from '../base';

const config: ModelConfig = {
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
            api_token: {
                type: 'keyword'
            },
            hash: {
                type: 'keyword'
            },
            salt: {
                type: 'keyword'
            },
            roles: {
                type: 'keyword'
            }
        }
    },
    schema: {
        properties: {
            client_id: {
                type: 'number'
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
            roles: {
                type: 'array',
                items: {
                    type: 'string'
                },
                uniqueItems: true,
                maxItems: 1,
                default: []
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
            'username',
            'firstname',
            'lastname',
        ]
    },
    uniqueFields: ['username', 'api_token'],
    sanitizeFields: {
        email: 'trimAndLower',
        username: 'trim',
    },
    fixDoc: function fixDoc(doc: any) {
        if (doc && doc.role) {
            doc.roles = [doc.role];
            delete doc.role;
        }

        return doc;
    },
    typeDef: `
        type UserModel {
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
    `
};

export = config;
