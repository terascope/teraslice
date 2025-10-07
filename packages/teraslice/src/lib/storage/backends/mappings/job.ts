export default {
    settings: {
        'index.number_of_shards': 5,
        'index.number_of_replicas': 1
    },
    mappings: {
        _all: {
            enabled: false
        },
        dynamic: false,
        properties: {
            active: {
                type: 'boolean'
            },
            job_id: {
                type: 'keyword'
            },
            _context: {
                type: 'keyword'
            },
            _created: {
                type: 'date'
            },
            _updated: {
                type: 'date'
            },
            _deleted: {
                type: 'boolean'
            },
            _deleted_on: {
                type: 'date'
            }
        }
    }
};
