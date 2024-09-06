function getConnectors() {
    const connectors: Record<string, Record<string, any>> = {
        'elasticsearch-next': {
            default: {
                node: ['localhost:9200']
            }
        },
        kafka: {
            default: {
                brokers: ['localhost:9092']
            }
        }
    };

    return connectors;
}

export default {
    terafoundation: {
        environment: 'development',
        connectors: getConnectors()
    },
    teraslice: {
        master: true,
        name: 'teracluster'
    }
};
