import { CommandModule } from 'yargs';
import { castArray } from '@terascope/utils';
import * as config from '../helpers/config';
import { launchK8sEnv } from '../helpers/k8s-env';
import { kafkaVersionMapper } from '../helpers/mapper';

const availableServices = [
    'elasticsearch', 'kafka'
];

const cmd: CommandModule = {
    command: 'k8s-env [services..]',
    describe: 'Run a local kubernetes dev environment using kind',
    builder(yargs) {
        return yargs
        // FIXME: add examples
            .example('$0 k8s-env elasticsearch', '')
            .example('$0 k8s-env elasticsearch kafka', '')
            .example('$0 k8s-env elasticsearch kafka --debug --skip-build', '')
            .option('debug', {
                alias: 'd',
                description: 'This will launch a kubernetes dev environment and output any debug info',
                type: 'boolean',
                default: false,
            })
            .option('trace', {
                description: 'Sets the debug log level to trace',
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
            })
            .positional('services', {
                description: 'List of services that will be started in k8s',
                type: 'string',
                coerce(arg) {
                    castArray(arg).forEach((a) => {
                        if (!availableServices.includes(a)) {
                            throw new Error(`Service ${a} is not available. Create a kubernetes deployment yaml file in 'e2e/k8s' and add service name to the availableServices list.`);
                        }
                        setEnvVariable(arg);
                    });
                    if (arg.includes('kafka')) {
                        arg.push('zookeeper');
                    }
                    return arg;
                },
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
            trace: Boolean(argv.trace),
            skipBuild: Boolean(argv['skip-build']),
            services: argv.services as string[]
        });
    },
};

export = cmd;

function setEnvVariable(arg: string) {
    switch (arg.toLowerCase()) {
        case ('opensearch'):
            process.env.TEST_OPENSEARCH = undefined;
            break;
        case ('elasticsearch'):
            process.env.TEST_ELASTICSEARCH = undefined;
            break;
        case ('kafka'):
            process.env.TEST_KAFKA = undefined;
            break;
        case ('minio'):
            process.env.TEST_MINIO = undefined;
            break;
        case ('rabbitmq'):
            process.env.TEST_RABBITMQ = undefined;
            break;
        default:
            break;
    }
}
