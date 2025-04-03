import os from 'node:os';
import { execaCommandSync } from 'execa';
import { isCI } from '@terascope/utils';
import {
    dockerTag, isHelmInstalled, isHelmfileInstalled, isKindInstalled,
    isKubectlInstalled, getNodeVersionFromImage, launchTerasliceWithHelmfile,
    helmfileDestroy, determineSearchHost, deletePersistentVolumeClaim,
    generateTestCaCerts, createMinioSecret
} from '../scripts.js';
import { Kind } from '../kind.js';
import { K8sEnvOptions } from './interfaces.js';
import signale from '../signale.js';
import { getDevDockerImage, getRootInfo } from '../misc.js';
import { buildDevDockerImage } from '../publish/utils.js';
import { PublishOptions, PublishType } from '../publish/interfaces.js';
import * as config from '../config.js';
import { K8s } from './k8s.js';
import { loadImagesForHelm } from '../test-runner/services.js';

const rootInfo = getRootInfo();
const e2eImage = `${rootInfo.name}:e2e-nodev${config.NODE_VERSION}`;

export async function launchK8sEnv(options: K8sEnvOptions) {
    if (process.env.TEST_ELASTICSEARCH && process.env.ELASTICSEARCH_VERSION?.charAt(0) === '6' && isArm()) {
        signale.error('There is no compatible Elasticsearch6 image for arm based processors. Try a different elasticsearch version.');
        process.exit(1);
    }
    signale.pending('Starting k8s environment with the following options: ', options);
    const kind = new Kind(config.K8S_VERSION, options.kindClusterName);

    const kindInstalled = await isKindInstalled();
    if (!kindInstalled) {
        signale.error('Please install Kind before launching a k8s dev environment. https://kind.sigs.k8s.io/docs/user/quick-start');
        process.exit(1);
    }

    const helmfileInstalled = await isHelmfileInstalled();
    if (!helmfileInstalled && !isCI) {
        signale.error('Please install helmfile before running k8s tests. https://helmfile.readthedocs.io/en/latest/#installation');
        process.exit(1);
    }

    // TODO: Remove once all kubectl commands are converted to k8s client
    const kubectlInstalled = await isKubectlInstalled();
    if (!kubectlInstalled) {
        signale.error('Please install kubectl before launching a k8s dev environment. https://kubernetes.io/docs/tasks/tools/');
        process.exit(1);
    }

    await generateTestCaCerts();

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
            execaCommandSync('yarn setup');
        } catch (err) {
            signale.fatal(err);
            await kind.destroyCluster();
            process.exit(1);
        }
    }

    signale.pending('Loading service images into kind cluster');
    await loadImagesForHelm(options.kindClusterName, false);
    signale.success('Service images loaded into kind cluster');

    signale.pending('Loading teraslice image into kind cluster');
    await kind.loadTerasliceImage(e2eImage);
    signale.success('Teraslice image loaded into kind cluster');

    try {
        signale.pending('Launching teraslice with helmfile');
        // Create a minio secret if needed before helm sync
        // but after the namespaces have been made
        if (config.ENCRYPT_MINIO) {
            await createMinioSecret(k8s);
        }
        await launchTerasliceWithHelmfile(options.dev);
        signale.pending('Teraslice launched with helmfile');
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
    signale.time('Rebuild teraslice');

    const helmInstalled = await isHelmInstalled();
    if (!helmInstalled && !isCI) {
        signale.error('Please install Helm before running k8s tests.https://helm.sh/docs/intro/install');
        process.exit(1);
    }

    const kind = new Kind(config.K8S_VERSION, options.kindClusterName);

    signale.pending('Deleting Teraslice deployment');
    helmfileDestroy('teraslice');
    signale.success('Teraslice deployment successfully deleted');

    if (options.resetStore) {
        try {
            const searchHost = await determineSearchHost();
            signale.pending(`Reset-store option detected - deleting the ${searchHost} service`);
            await helmfileDestroy(searchHost);
            await deletePersistentVolumeClaim(searchHost);
            signale.success(`${searchHost} service successfully deleted`);
        } catch (err) {
            signale.error(`Failed to determine search host:\n${err}`);
        }
    }

    try {
        await buildAndTagTerasliceImage(options);
    } catch (err) {
        signale.error(err);
        process.exit(1);
    }

    signale.pending('Loading Teraslice Docker image');
    await kind.loadTerasliceImage(e2eImage);
    signale.success('Teraslice Docker image loaded');

    try {
        signale.pending('Launching rebuilt teraslice with helmfile');
        await launchTerasliceWithHelmfile(options.dev);
        signale.pending('Rebuilt Teraslice launched with helmfile');
        // await k8s.deployK8sTeraslice(
        //     options.clusteringType,
        //     true,
        //     options.dev,
        //     options.assetStorage
        // );
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

function isArm() {
    return os.machine() === 'arm' || os.machine() === 'arm64' || os.machine() === 'aarch64';
}
