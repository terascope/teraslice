import { ModelConfig } from '../base';
import { PrivateUserModel } from '../users';

const config: ModelConfig<PrivateUserModel> = {
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
            role: {
                type: 'keyword'
            }
        }
    },
    schema: {
        properties: {
            client_id: {
                type: 'number',
                default: 0,
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
        email: 'trimAndToLower',
        username: 'trim',
    },
    strictMode: false,
};

export = config;
