import { CommandModule } from 'yargs';
import * as config from '../helpers/config';
import { launchK8sEnv } from '../helpers/k8s-env';
import { kafkaVersionMapper } from '../helpers/mapper';

const cmd: CommandModule = {
    command: 'k8s-env',
    describe: 'Run a local kubernetes dev environment using kind.',
    builder(yargs) {
        return yargs
            .example('$0 k8s-env', 'Start a kind kubernetes cluster running teraslice and elasticsearch.')
            .example('TEST_KAFKA=\'true\' $0 k8s-env', 'Start a kind kubernetes cluster running teraslice, elasticsearch, kafka, and zookeeper.')
            .example('$0 k8s-env --skip-build', 'Start a kind kubernetes cluster, but skip building a new teraslice docker image.')
            .option('debug', {
                alias: 'd',
                description: 'This will launch a kubernetes dev environment and output any debug info',
                type: 'boolean',
                default: false,
            })
            .option('elasticsearch-version', {
                description: 'The elasticsearch version to use',
                type: 'string',
                default: config.ELASTICSEARCH_VERSION,
            })
            .option('kafka-version', {
                description: 'The kafka version to use',
                type: 'string',
                default: config.KAFKA_VERSION,
            })
            .option('minio-version', {
                description: 'The minio version to use',
                type: 'string',
                default: config.MINIO_VERSION,
            })
            .option('rabbitmq-version', {
                description: 'The rabbitmq version to use',
                type: 'string',
                default: config.RABBITMQ_VERSION,
            })
            .option('opensearch-version', {
                description: 'The opensearch version to use',
                type: 'string',
                default: config.OPENSEARCH_VERSION,
            })
            .option('node-version', {
                description: 'Node version, there must be a Docker base image with this version (e.g. 18.16.0)',
                type: 'string',
                default: config.NODE_VERSION
            })
            .option('skip-build', {
                description: 'Skip building the teraslice docker iamge',
                type: 'boolean',
                default: false
            });
    },
    handler(argv) {
        const kafkaVersion = argv.kafkaVersion as string;
        const kafkaCPVersion = kafkaVersionMapper(kafkaVersion);

        return launchK8sEnv({
            debug: Boolean(argv.debug),
            elasticsearchVersion: argv.elasticsearchVersion as string,
            kafkaVersion,
            kafkaImageVersion: kafkaCPVersion,
            zookeeperVersion: kafkaCPVersion,
            minioVersion: argv.minioVersion as string,
            rabbitmqVersion: argv.rabbitmqVersion as string,
            opensearchVersion: argv.opensearchVersion as string,
            nodeVersion: argv['node-version'] as string,
            skipBuild: Boolean(argv['skip-build'])
        });
    },
};

export = cmd;
