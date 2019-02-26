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
    fixDoc: function fixDoc(doc) {
        const _doc = doc as any;
        if (_doc && _doc.role) {
            _doc.roles = [_doc.role];
            delete _doc.role;
        }

        return doc;
    },
    strictMode: false,
};

export = config;
