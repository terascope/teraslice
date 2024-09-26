import execa from 'execa';
import {
    dockerTag, isKindInstalled, isKubectlInstalled,
    k8sStartService, k8sStopService, getNodeVersionFromImage
} from '../scripts.js';
import { Kind } from '../kind.js';
import { K8sEnvOptions } from './interfaces.js';
import signale from '../signale.js';
import { getDevDockerImage, getRootInfo } from '../misc.js';
import { buildDevDockerImage } from '../publish/utils.js';
import { PublishOptions, PublishType } from '../publish/interfaces.js';
import * as config from '../config.js';
import { ensureServices } from '../test-runner/services.js';
import { K8s } from './k8s.js';

const rootInfo = getRootInfo();
const e2eImage = `${rootInfo.name}:e2e-nodev${config.NODE_VERSION}`;

export async function launchK8sEnv(options: K8sEnvOptions) {
    signale.pending('Starting k8s environment with the following options: ', options);
    const kind = new Kind(config.K8S_VERSION, options.kindClusterName);
    // TODO: create a kind class
    const kindInstalled = await isKindInstalled();
    if (!kindInstalled) {
        signale.error('Please install Kind before launching a k8s dev environment. https://kind.sigs.k8s.io/docs/user/quick-start');
        process.exit(1);
    }

    // TODO: Remove once all kubectl commands are converted to k8s client
    const kubectlInstalled = await isKubectlInstalled();
    if (!kubectlInstalled) {
        signale.error('Please install kubectl before launching a k8s dev environment. https://kubernetes.io/docs/tasks/tools/');
        process.exit(1);
    }

    signale.pending('Creating kind cluster');
    try {
        await kind.createCluster(options.tsPort, options.dev);
    } catch (err) {
        signale.error(err);
        // Do not destroy existing cluster if that was the cause of failure
        if (!err.stderr.includes('node(s) already exist for a cluster with the name')) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }
    signale.success('Kind cluster created');

    const k8s = new K8s(options.tsPort, options.kindClusterName);
    try {
        await k8s.createNamespace('services-ns.yaml', 'services');
    } catch (err) {
        signale.fatal(err);
        if (!options.keepOpen) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }

    try {
        await buildAndTagTerasliceImage(options);
    } catch (err) {
        signale.fatal(err);
        if (!options.keepOpen) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }

    // If --dev is true, we must run yarn setup before creating resources
    // We need a local node_modules folder built to add it as a volume
    if (options.dev) {
        let imageVersion: string;
        try {
            imageVersion = await getNodeVersionFromImage(e2eImage);
        } catch (err) {
            await kind.destroyCluster();
            throw new Error(`Problem running docker command to check node version: ${err}`);
        }
        if (process.version !== imageVersion) {
            signale.fatal(`The node version this process is running on (${process.version}) does not match
            the version set in k8s-env image (${imageVersion}). Check your version by running "node -v"`);
            await kind.destroyCluster();
            process.exit(1);
        }
        signale.info(`Running yarn setup with node ${process.version}...`);
        try {
            execa.commandSync('yarn setup');
        } catch (err) {
            signale.fatal(err);
            await kind.destroyCluster();
            process.exit(1);
        }
    }

    await kind.loadTerasliceImage(e2eImage);

    await ensureServices('k8s-env', {
        ...options,
        debug: false,
        trace: false,
        bail: false,
        watch: false,
        all: false,
        keepOpen: false,
        reportCoverage: false,
        useExistingServices: false,
        ignoreMount: false,
        testPlatform: options.clusteringType
    });

    try {
        await k8s.deployK8sTeraslice(
            options.clusteringType,
            true,
            options.dev,
            options.assetStorage
        );
    } catch (err) {
        signale.fatal('Error deploying Teraslice: ', err);
        if (!options.keepOpen) {
            signale.warn('Shutting down k8s cluster');
            await kind.destroyCluster();
        }
        process.exit(1);
    }
    signale.success('k8s environment ready.\nNext steps:\n\tAdd alias: teraslice-cli aliases add <cluster-alias> http://localhost:5678\n\t\tExample: teraslice-cli aliases add cluster1 http://localhost:5678\n\tLoad assets: teraslice-cli assets deploy <cluster-alias> <user/repo-name>\n\t\tExample: teraslice-cli assets deploy cluster1 terascope/elasticsearch-assets\n\tRegister a job: teraslice-cli tjm register <cluster-alias> <path/to/job/file.json>\n\t\tExample: teraslice-cli tjm reg cluster1 JOB.JSON\n\tStart a job: teraslice-cli tjm start <path/to/job/file.json>\n\t\tExample: teraslice-cli tjm start JOB.JSON\n\tDelete the kind k8s cluster: kind delete cluster --name <clusterName>\n\t\tExample: kind delete cluster --name k8s-env\n\tSee the docs for more options: https://terascope.github.io/teraslice/docs/packages/teraslice-cli/overview');
}

export async function rebuildTeraslice(options: K8sEnvOptions) {
    const kind = new Kind(config.K8S_VERSION, options.kindClusterName);
    let k8s: K8s;
    try {
        k8s = new K8s(options.tsPort, options.kindClusterName);
    } catch (err) {
        signale.error('k8s-env --rebuild command failed. Do you have a running k8s cluster?');
        process.exit(1);
    }

    signale.time('Rebuild teraslice');

    try {
        await buildAndTagTerasliceImage(options);
    } catch (err) {
        signale.error(err);
        process.exit(1);
    }

    signale.pending('Loading Teraslice Docker image');
    await kind.loadTerasliceImage(e2eImage);
    signale.success('Teraslice Docker image loaded');

    if (options.resetStore) {
        signale.pending('Resetting the elasticsearch service');
        await k8sStopService('elasticsearch');
        await k8sStartService('elasticsearch', config.ELASTICSEARCH_DOCKER_IMAGE, config.ELASTICSEARCH_VERSION, kind);
        signale.success('elasticsearch service reset');
    }

    try {
        await k8s.deployK8sTeraslice(
            options.clusteringType,
            true,
            options.dev,
            options.assetStorage
        );
    } catch (err) {
        signale.error('Error re-deploying Teraslice: ', err);
        process.exit(1);
    }
    signale.timeEnd('Rebuild teraslice');
}

async function buildAndTagTerasliceImage(options: K8sEnvOptions) {
    let runImage;
    if (options.terasliceImage) {
        runImage = options.terasliceImage;
    } else if (options.skipBuild) {
        runImage = getDevDockerImage(config.NODE_VERSION);
    } else {
        try {
            const publishOptions: PublishOptions = {
                dryRun: true,
                nodeSuffix: true,
                nodeVersion: config.NODE_VERSION,
                type: PublishType.Dev,
                useDevFile: options.dev
            };
            runImage = await buildDevDockerImage(publishOptions);
        } catch (err) {
            throw new Error(`Docker image build failed: ${err}`);
        }
    }

    try {
        await dockerTag(runImage, e2eImage);
    } catch (err) {
        throw new Error(`Failed to tag docker image ${runImage} as ${e2eImage}: ${err}`);
    }
}
