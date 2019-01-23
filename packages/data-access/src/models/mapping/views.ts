const mapping = {
    _all: {
        enabled: false
    },
    dynamic: false,
    properties: {
        id: {
            type: 'keyword'
        },
        name: {
            type: 'keyword'
        },
        created: {
            type: 'date'
        },
        updated: {
            type: 'date'
        }
    }
};

export default mapping;
