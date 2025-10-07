export default {
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
            ex_id: {
                type: 'keyword'
            },
            _context: {
                type: 'keyword'
            },
            _status: {
                type: 'keyword'
            },
            _has_errors: {
                type: 'keyword'
            },
            slicer_hostname: {
                type: 'keyword'
            },
            slicer_port: {
                type: 'keyword'
            },
            recovered_execution: {
                type: 'keyword'
            },
            recovered_slice_type: {
                type: 'keyword'
            },
            metadata: {
                type: 'object',
                enabled: false
            },
            _slicer_stats: {
                type: 'object'
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
