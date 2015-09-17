'use strict';
var schema = {
    teraslice_ops_directory: {
        doc: '',
        default: '/Users/jarednoble/Desktop/fakeOps'
    },
    shutdown_timeout: {
        doc: '',
        default: 60
    },
    reporter: {
        doc: '',
        default: ''
    }
};


function config_schema(config) {
    var config = config;
    //TODO do something with config if needed

    return schema;
}

module.exports = {
    config_schema: config_schema,
    schema: schema
};