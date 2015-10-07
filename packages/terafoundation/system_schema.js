'use strict';

module.exports = {
    environment: {
        doc: '',
        default: 'development'
    },
    log_path: {
        default: '/Users/jarednoble/Desktop/logs'
    }
    /*elasticsearch: {
        default: {
            doc: '',
            default: {
                host: ["127.0.0.1:9200"],
                keepAlive: false,
                maxRetries: 5,
                maxSockets: 20
            }
        }
    },
    statsd: {
        default: {
            default: {
                host: '127.0.0.1',
                mock: false
            }
        }
    },
    mongodb: {
        replicaSet: {
            doc: "",
            default: "app"
        },
        replicaSetTimeout: {
            doc: "",
            default: 30000
        },
        default: {
            doc: '',
            default: {servers: "mongodb://localhost:27017/teratest"}
        }
    }*/

};
