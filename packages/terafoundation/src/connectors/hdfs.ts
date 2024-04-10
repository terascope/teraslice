import { Logger } from '@terascope/utils';
// @ts-expect-error
import { WebHDFSClient } from 'node-webhdfs';
import { TerafoundationConnector } from '../interfaces.js';

const connector: TerafoundationConnector = {
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        logger.info(`Using hdfs hosts: ${customConfig.host}`);

        // TODO: there's no error handling here at all???
        const client = new WebHDFSClient(customConfig);

        return {
            client,
            logger
        };
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

export default connector;
