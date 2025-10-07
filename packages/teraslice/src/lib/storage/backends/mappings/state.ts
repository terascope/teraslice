export default {
    template: '__state*',
    mappings: {
        _all: {
            enabled: false
        },
        dynamic: false,
        properties: {
            ex_id: {
                type: 'keyword'
            },
            slice_id: {
                type: 'keyword'
            },
            slicer_id: {
                type: 'keyword'
            },
            slicer_order: {
                type: 'integer'
            },
            state: {
                type: 'keyword'
            },
            _created: {
                type: 'date'
            },
            _updated: {
                type: 'date'
            },
            error: {
                type: 'keyword'
            }
        }
    }
};
