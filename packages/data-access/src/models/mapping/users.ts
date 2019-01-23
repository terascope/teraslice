 const mapping = {
    _all: {
        enabled: false
    },
    dynamic: false,
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
        role: {
            type: 'keyword'
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
        created: {
            type: 'date'
        },
        updated: {
            type: 'date'
        },
        id: {
            type: 'keyword'
        }
    }
};

export default mapping;
