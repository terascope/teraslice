export default {
    template: '__analytics*',
    mappings: {
        _all: {
            enabled: false
        },
        dynamic: false,
        properties: {
            ex_id: {
                type: 'keyword'
            },
            job_id: {
                type: 'keyword'
            },
            worker_id: {
                type: 'keyword'
            },
            slice_id: {
                type: 'keyword'
            },
            slicer_id: {
                type: 'keyword'
            },
            op: {
                type: 'keyword'
            },
            order: {
                type: 'integer'
            },
            count: {
                type: 'integer'
            },
            state: {
                type: 'keyword'
            },
            time: {
                type: 'integer'
            },
            memory: {
                type: 'long'
            },
            '@timestamp': {
                type: 'date'
            }
        }
    }
};
