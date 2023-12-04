import {
    createKindCluster,
    destroyKindCluster,
    dockerTag,
    isKindInstalled,
    isKubectlInstalled,
    kindLoadTerasliceImage
} from '../scripts';
import { k8sEnvOptions } from './interfaces';
import signale from '../signale';
import { getDevDockerImage, getRootInfo } from '../misc';
import { buildDevDockerImage } from '../publish/utils';
import { PublishOptions, PublishType } from '../publish/interfaces';
import * as config from '../config';
import { ensureServices } from '../test-runner/services';
import { K8s } from './k8s';

const rootInfo = getRootInfo();
const e2eImage = `${rootInfo.name}:e2e`;

export async function launchK8sEnv(options: k8sEnvOptions) {
    signale.pending('Starting k8s environment with the following options: ', options);

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
    await createKindCluster('k8s-env', options.tsPort);
    signale.success('Kind cluster created');

    const k8s = new K8s(options.tsPort);
    try {
        await k8s.createNamespace('services-ns.yaml', 'services');
    } catch (err) {
        signale.fatal(err);
        await destroyKindCluster();
        process.exit(1);
    }

    try {
        await buildAndTagTerasliceImage(options);
    } catch (err) {
        signale.error(err);
        await destroyKindCluster();
        process.exit(1);
    }

    await kindLoadTerasliceImage(e2eImage);

    await ensureServices('k8s_env', {
        ...options,
        debug: false,
        trace: false,
        bail: false,
        watch: false,
        all: false,
        keepOpen: false,
        reportCoverage: false,
        useExistingServices: false,
        elasticsearchAPIVersion: config.ELASTICSEARCH_API_VERSION,
        ignoreMount: false,
        testPlatform: 'kubernetes'
    });

    try {
        await k8s.deployK8sTeraslice(true);
    } catch (err) {
        signale.fatal('Error deploying Teraslice. Shutting down k8s cluster: ', err);
        await destroyKindCluster();
        process.exit(1);
    }
    signale.success('k8s environment ready.\nNext steps:\n\tAdd alias: teraslice-cli aliases add <cluster-alias> http://localhost:5678\n\t\tExample: teraslice-cli aliases add cluster1 http://localhost:5678\n\tLoad assets: teraslice-cli assets deploy <cluster-alias> <user/repo-name>\n\t\tExample: teraslice-cli assets deploy cluster1 terascope/elasticsearch-assets\n\tRegister a job: teraslice-cli tjm register <cluster-alias> <path/to/job/file.json>\n\t\tExample: teraslice-cli tjm reg cluster1 JOB.JSON\n\tStart a job: teraslice-cli tjm start <path/to/job/file.json>\n\t\tExample: teraslice-cli tjm start JOB.JSON\nDelete the kind k8s cluster: kind delete cluster --name k8se2e\n\tSee the docs for more options: https://terascope.github.io/teraslice/docs/packages/teraslice-cli/overview');
}

export async function rebuildTeraslice(options: k8sEnvOptions) {
    let k8s: K8s;
    try {
        k8s = new K8s(options.tsPort);
    } catch (err) {
        signale.error('k8se-env --rebuild command failed. Do you have a running k8s cluster?');
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
    await kindLoadTerasliceImage(e2eImage);
    signale.success('Teraslice Docker image loaded');

    try {
        await k8s.deployK8sTeraslice(true);
    } catch (err) {
        signale.error('Error re-deploying Teraslice: ', err);
        process.exit(1);
    }
    signale.timeEnd('Rebuild teraslice');
}

async function buildAndTagTerasliceImage(options:k8sEnvOptions) {
    let devImage;
    if (options.skipBuild) {
        devImage = `${getDevDockerImage()}-nodev${options.nodeVersion}`;
    } else {
        try {
            const publishOptions: PublishOptions = {
                dryRun: true,
                nodeVersion: options.nodeVersion,
                type: PublishType.Dev
            };
            devImage = await buildDevDockerImage(publishOptions);
        } catch (err) {
            throw new Error(`Docker image build failed: ${err}`);
        }
    }

    try {
        await dockerTag(devImage, e2eImage);
    } catch (err) {
        throw new Error(`Failed to tag docker image ${devImage} as ${e2eImage}: ${err}`);
    }
}
