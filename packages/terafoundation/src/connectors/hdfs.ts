'use strict';

function create(customConfig, logger) {
    const HdfsClient = require('node-webhdfs').WebHDFSClient;
    logger.info(`Using hdfs hosts: ${customConfig.host}`);

    // TODO: there's no error handling here at all???
    const client = new HdfsClient(customConfig);

    return {
        client
    };
}

module.exports = {
    create,
    config_schema() {
        return {
            user: {
                doc: '',
                default: 'webuser'
            },
            namenode_port: {
                doc: '',
                default: 50070
            },
            namenode_host: {
                doc: '',
                default: 'localhost'
            },
            path_prefix: {
                doc: '',
                default: '/webhdfs/v1'
            }
        };
    }
};
