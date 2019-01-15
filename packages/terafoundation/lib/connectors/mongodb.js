'use strict';

function create(customConfig, logger) {
    const mongoose = require('mongoose');
    // TODO: rework configuration to allow incoming config to be a full mongo config
    logger.info(`Using mongo connection string: ${customConfig.servers}`);

    const serverConfig = {
        server: {
            auto_reconnect: true,
            socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 }
        }
    };

    if (customConfig.replicaSet) {
        serverConfig.replset = {
            rs_name: customConfig.replicaSet,
            socketOptions: {
                keepAlive: 1,
                connectTimeoutMS: customConfig.replicaSetTimeout
            },
            readPreference: 'secondaryPreferred'
        };
    }

    mongoose.connect(customConfig.servers, serverConfig, (error) => {
        if (error) {
            logger.error(`Could not connect to Mongo DB: ${error}`);
        }
    });

    return {
        client: mongoose
    };
}

module.exports = {
    create,
    config_schema: {
        servers: {
            doc: '',
            default: 'mongodb://localhost:27017/test'
        }
    }
};
