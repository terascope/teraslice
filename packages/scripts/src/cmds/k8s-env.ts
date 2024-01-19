import { CommandModule } from 'yargs';
import * as config from '../helpers/config';
import { launchK8sEnv, rebuildTeraslice } from '../helpers/k8s-env';
import { kafkaVersionMapper } from '../helpers/mapper';

const cmd: CommandModule = {
    command: 'k8s-env',
    describe: 'Run a local kubernetes dev environment using kind.',
    builder(yargs) {
        return yargs
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' $0 k8s-env', 'Start a kind kubernetes cluster running teraslice and elasticsearch.')
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' TEST_KAFKA=\'true\' KAFKA_PORT=\'9092\' $0 k8s-env', 'Start a kind kubernetes cluster running teraslice, elasticsearch, kafka, and zookeeper.')
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' SKIP_DOCKER_BUILD_IN_K8S=\'true\' $0 k8s-env', 'Start a kind kubernetes cluster, but skip building a new teraslice docker image.')
            .example('$0 k8s-env --rebuild=\'true\'', 'Rebuild teraslice and redeploy to k8s cluster. ES store data is retained.')
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
                description: 'Skip building the teraslice docker image',
                type: 'boolean',
                default: config.SKIP_DOCKER_BUILD_IN_K8S
            })
            .option('rebuild', {
                description: 'Stop, rebuild, then restart the teraslice docker image',
                type: 'boolean',
                default: false
            })
            .option('ts-port', {
                description: 'Port where teraslice api will be exposed.',
                type: 'number',
                default: 5678
            })
            .option('cluster-name', {
                description: 'Name of the kind kubernetes cluster.',
                type: 'string',
                default: 'k8s-env'
            })
            .option('k8s-version', {
                description: 'Version of kubernetes to use in the kind cluster.',
                type: 'string',
                default: config.K8S_VERSION
            })
            .option('teraslice-image', {
                description: 'Skip build and run teraslice using this image.',
                type: 'string',
                default: config.TERASLICE_IMAGE
            });
    },
    handler(argv) {
        const kafkaCPVersion = kafkaVersionMapper(argv.kafkaVersion as string);
        const k8sEnvOptions = {
            elasticsearchVersion: argv.elasticsearchVersion as string,
            kafkaVersion: argv.kafkaVersion as string,
            kafkaImageVersion: kafkaCPVersion,
            zookeeperVersion: kafkaCPVersion,
            minioVersion: argv.minioVersion as string,
            rabbitmqVersion: argv.rabbitmqVersion as string,
            opensearchVersion: argv.opensearchVersion as string,
            nodeVersion: argv['node-version'] as string,
            skipBuild: Boolean(argv['skip-build']),
            tsPort: argv['ts-port'] as number,
            clusterName: argv['cluster-name'] as string,
            k8sVersion: argv['k8s-version'] as string,
            terasliceImage: argv['teraslice-image'] as string
        };

        if (Boolean(argv.rebuild) === true) {
            return rebuildTeraslice(k8sEnvOptions);
        }

        return launchK8sEnv(k8sEnvOptions);
    },
};

export = cmd;
