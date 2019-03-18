'use strict';

function hasKafkaConnector() {
    try {
        // eslint-disable-next-line
        require('terafoundation_kafka_connector');
        return true;
    } catch (err) {
        return false;
    }
}

function getConnectors() {
    const connectors = {
        elasticsearch: {
            default: {
                host: ['localhost:9200']
            }
        }
    };

    if (hasKafkaConnector()) {
        connectors.kafka = {
            default: {
                brokers: ['localhost:9092']
            }
        };
    }

    return connectors;
}

module.exports = {
    terafoundation: {
        environment: 'development',
        connectors: getConnectors()
    },
    teraslice: {
        master: true,
        name: 'teracluster'
    }
};
