export default {
    mappings: {
        dynamic: false,
        properties: {
            blob: {
                type: 'binary',
                doc_values: false
            },
            name: {
                type: 'keyword'
            },
            version: {
                type: 'keyword'
            },
            id: {
                type: 'keyword'
            },
            description: {
                type: 'keyword'
            },
            arch: {
                type: 'keyword'
            },
            platform: {
                type: 'keyword'
            },
            node_version: {
                type: 'integer'
            },
            _created: {
                type: 'date'
            }
        }
    }
};
