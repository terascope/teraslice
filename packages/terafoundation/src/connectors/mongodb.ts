import { Logger } from '@terascope/utils';

function create(customConfig: any, logger: Logger) {
    const mongoose = require('mongoose');
    // TODO: rework configuration to allow incoming config to be a full mongo config
    logger.info(`Using mongo connection string: ${customConfig.servers}`);

    const serverConfig: any = {
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

    mongoose.connect(customConfig.servers, serverConfig, (error: any) => {
        if (error) {
            logger.error(error, 'Could not connect to Mongo DB:');
        }
    });

    return {
        client: mongoose
    };
}

export default {
    create,
    config_schema() {
        return {
            servers: {
                doc: '',
                default: 'mongodb://localhost:27017/test'
            }
        };
    }
};
