import { CommandModule } from 'yargs';
import * as config from '../helpers/config.js';
import { launchK8sEnv, rebuildTeraslice } from '../helpers/k8s-env/index.js';
import { K8sEnvOptions } from '../helpers/k8s-env/interfaces.js';

const cmd: CommandModule = {
    command: 'k8s-env',
    describe: 'Run a local kubernetes dev environment using kind.',
    builder(yargs) {
        return yargs
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' $0 k8s-env', 'Start a kind kubernetes cluster running teraslice from your local repository and elasticsearch.')
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' $0 k8s-env --dev', 'Start a kind kubernetes cluster running teraslice in dev mode. Faster build times.')
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' $0 k8s-env --teraslice-image=terascope/teraslice:v0.91.0-nodev18.18.2', 'Start a kind kubernetes cluster running teraslice from a specific docker image and elasticsearch.')
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' TEST_KAFKA=\'true\' KAFKA_PORT=\'9092\' $0 k8s-env', 'Start a kind kubernetes cluster running teraslice, elasticsearch, kafka, and zookeeper.')
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' $0 k8s-env --skip-build', 'Start a kind kubernetes cluster, but skip building a new teraslice docker image.')
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' $0 k8s-env --keep-open', 'Start a kind kubernetes cluster, preserving the kind cluster on failure.')
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' $0 k8s-env --rebuild', 'Stop teraslice, rebuild docker image, and restart teraslice.')
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' $0 k8s-env --rebuild --reset-store', 'Rebuild and also clear the elasticsearch store.')
            .example('TEST_ELASTICSEARCH=\'true\' ELASTICSEARCH_PORT=\'9200\' $0 k8s-env --rebuild --skip-build', 'Restart teraslice without rebuilding docker image.')
            .example('$0 k8s-env --rebuild', 'Rebuild teraslice and redeploy to k8s cluster. ES store data is retained.')
            .option('encrypt-minio', {
                description: 'Add TLS encryption to minio service',
                type: 'boolean',
                default: config.ENCRYPT_MINIO,
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
            .option('reset-store', {
                description: 'Restart the elasticsearch service when rebuilding teraslice. This flag is ignored if not accompanied by --rebuild',
                type: 'boolean',
                default: false
            })
            .option('ts-port', {
                description: 'Port where teraslice api will be exposed.',
                type: 'string',
                default: '5678'
            })
            .option('cluster-name', {
                description: 'Name of the kind kubernetes cluster.',
                type: 'string',
                default: 'k8s-env'
            })
            .option('teraslice-image', {
                description: 'Skip build and run teraslice using this image.',
                type: 'string',
                default: config.TERASLICE_IMAGE
            })
            .option('asset-storage', {
                description: 'Choose what backend service assets are stored in.',
                type: 'string',
                default: 'elasticsearch-next',
                choices: ['elasticsearch-next', 's3'],
            })
            .option('clustering-type', {
                description: 'Clustering version teraslice will use',
                type: 'string',
                default: config.CLUSTERING_TYPE,
                choices: ['kubernetes', 'kubernetesV2']
            })
            .option('keep-open', {
                description: 'This will cause the kind cluster to remain open after a failure (so it can be debugged).',
                type: 'boolean',
                default: false,
            })
            .option('dev', {
                description: 'Mounts local teraslice to k8s resources for faster development.',
                type: 'boolean',
                default: false
            })
            .check((args) => {
                if (args['asset-storage'] === 's3' && process.env.TEST_MINIO !== 'true') {
                    throw new Error('You chose "s3" as an asset storage but don\'t have the minio service enabled.\n'
                        + 'Try either using "yarn k8s:minio" or setting the environment variable TEST_MINIO to true\n');
                }
                return true;
            });
    },
    handler(argv) {
        const k8sOptions: K8sEnvOptions = {
            encryptMinio: argv['encrypt-minio'] as boolean,
            skipBuild: Boolean(argv['skip-build']),
            tsPort: argv['ts-port'] as string,
            kindClusterName: argv['cluster-name'] as string,
            terasliceImage: argv['teraslice-image'] as string,
            assetStorage: argv['asset-storage'] as string,
            dev: Boolean(argv.dev),
            clusteringType: argv['clustering-type'] as 'kubernetes' | 'kubernetesV2',
            keepOpen: Boolean(argv['keep-open']),
        };

        if (Boolean(argv.rebuild) === true) {
            if (argv['reset-store']) {
                k8sOptions.resetStore = true;
            }
            return rebuildTeraslice(k8sOptions);
        }

        return launchK8sEnv(k8sOptions);
    },
};

export default cmd;
