import { SanitizeFields } from '../base';

/** Schema Version */
export const version = 1;

/** Name of Data Type */
export const name = 'users';

/** ElasticSearch Mapping */
export const mapping = {
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
};

/** JSON Schema */
export const schema = {
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
};

export const uniqueFields = ['username', 'api_token'];

export const sanitizeFields: SanitizeFields = {
    email: 'trimAndLower',
    username: 'trim',
};

export function fixDoc(doc: any) {
    if (doc && doc.role) {
        doc.roles = [doc.role];
        delete doc.role;
    }

    return doc;
}
