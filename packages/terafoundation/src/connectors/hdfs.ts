import { Logger } from '@terascope/utils';
import * as client from 'node-webhdfs';

const { WebHDFSClient: HdfsClient } = client;

function create(customConfig: Record<string, any>, logger: Logger): {
    client: any;
} {
    logger.info(`Using hdfs hosts: ${customConfig.host}`);

    // TODO: there's no error handling here at all???
    const client = new HdfsClient(customConfig);

    return {
        client
    };
}

export default {
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        return create(customConfig, logger);
    },
    config_schema(): Record<string, any> {
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
