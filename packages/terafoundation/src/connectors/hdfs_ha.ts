import { Logger } from '@terascope/core-utils';
import type { Terafoundation } from '@terascope/types';
import pkg from 'bluebird';
// @ts-expect-error
import { WebHDFSClient } from 'node-webhdfs';

const { promisifyAll } = pkg;

const connector: Terafoundation.Connector = {
    async createClient(customConfig: Record<string, any>, logger: Logger) {
        let highAvailibility = false;
        let currentNameNode;

        if (Array.isArray(customConfig.namenode_host)) {
            ([currentNameNode] = customConfig.namenode_host);
            customConfig.namenode_list = customConfig.namenode_host;
            highAvailibility = true;
        } else {
            currentNameNode = customConfig.namenode_host;
        }

        const config = Object.assign({}, customConfig, { namenode_host: currentNameNode });
        const client = new WebHDFSClient(config);

        logger.info(`Using hdfs hosts: ${currentNameNode}, high-availability: ${highAvailibility}`);

        return {
            client: promisifyAll(client),
            logger
        };
    },
    config_schema(): Record<string, any> {
        return {
            user: {
                doc: 'user type for hdfs requests',
                default: 'hdfs',
                format: String
            },
            namenode_port: {
                doc: 'port of hdfs',
                default: 50070
            },
            namenode_host: {
                doc: 'a single host, or multiple hosts listed in an array',
                default: null,
                format(val: any) {
                    if (typeof val === 'string') {
                        return;
                    }
                    if (Array.isArray(val)) {
                        if (val.length < 2) {
                            throw new Error('namenode_host must have at least two namenodes listed in the array');
                        }
                        return;
                    }
                    throw new Error('namenode_host configuration must be set to an array for high availability or a string');
                }
            },
            path_prefix: {
                doc: 'endpoint for hdfs web interface',
                default: '/webhdfs/v1'
            }
        };
    }
};

export default connector;
