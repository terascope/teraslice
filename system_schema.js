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

var slicerSchema = {
    port: {
        doc: 'Port for slicer',
        default: 5678
    },
    host: {
        doc: 'IP or hostname where slicer resides',
        default: 'localhost:'
    },
    primary: {
        doc: 'Determines if master process should create a slicer on that node',
        default: false
    }
};


function config_schema(config) {
    var config = config;
    //TODO do something with config if needed
    if (config.teraslice.slicer) {
        schema.slicer = slicerSchema;
        return schema;
    }
    else {
        return schema;
    }
}

module.exports = {
    config_schema: config_schema,
    schema: schema
};