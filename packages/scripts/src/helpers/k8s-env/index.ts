import {
    dockerTag,
    isKindInstalled,
    isKubectlInstalled,
    k8sStartService,
    k8sStopService,
} from '../scripts';
import { Kind } from '../kind';
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

    const kind = new Kind(options.k8sVersion, options.clusterName);
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
        await kind.createCluster(options.tsPort);
    } catch (err) {
        signale.error(err);
        // Do not destroy existing cluster if that was the cause of failure
        if (!err.stderr.includes('node(s) already exist for a cluster with the name')) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }
    signale.success('Kind cluster created');

    const k8s = new K8s(options.tsPort, options.clusterName);
    try {
        await k8s.createNamespace('services-ns.yaml', 'services');
    } catch (err) {
        signale.fatal(err);
        await kind.destroyCluster();
        process.exit(1);
    }

    try {
        await buildAndTagTerasliceImage(options);
    } catch (err) {
        signale.fatal(err);
        await kind.destroyCluster();
        process.exit(1);
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
        elasticsearchAPIVersion: config.ELASTICSEARCH_API_VERSION,
        ignoreMount: false,
        testPlatform: 'kubernetes'
    });

    try {
        await k8s.deployK8sTeraslice(true);
    } catch (err) {
        signale.fatal('Error deploying Teraslice. Shutting down k8s cluster: ', err);
        await kind.destroyCluster();
        process.exit(1);
    }
    signale.success('k8s environment ready.\nNext steps:\n\tAdd alias: teraslice-cli aliases add <cluster-alias> http://localhost:5678\n\t\tExample: teraslice-cli aliases add cluster1 http://localhost:5678\n\tLoad assets: teraslice-cli assets deploy <cluster-alias> <user/repo-name>\n\t\tExample: teraslice-cli assets deploy cluster1 terascope/elasticsearch-assets\n\tRegister a job: teraslice-cli tjm register <cluster-alias> <path/to/job/file.json>\n\t\tExample: teraslice-cli tjm reg cluster1 JOB.JSON\n\tStart a job: teraslice-cli tjm start <path/to/job/file.json>\n\t\tExample: teraslice-cli tjm start JOB.JSON\nDelete the kind k8s cluster: kind delete cluster --name <clusterName>\n\t\tExample: kind delete cluster --name k8s-env\n\tSee the docs for more options: https://terascope.github.io/teraslice/docs/packages/teraslice-cli/overview');
}

export async function rebuildTeraslice(options: k8sEnvOptions) {
    const kind = new Kind(options.k8sVersion, options.clusterName);
    let k8s: K8s;
    try {
        k8s = new K8s(options.tsPort, options.clusterName);
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
        await k8s.deployK8sTeraslice(true);
    } catch (err) {
        signale.error('Error re-deploying Teraslice: ', err);
        process.exit(1);
    }
    signale.timeEnd('Rebuild teraslice');
}

async function buildAndTagTerasliceImage(options:k8sEnvOptions) {
    let runImage;
    if (options.terasliceImage) {
        runImage = options.terasliceImage;
    } else if (options.skipBuild) {
        runImage = getDevDockerImage(options.nodeVersion);
    } else {
        try {
            const publishOptions: PublishOptions = {
                dryRun: true,
                nodeSuffix: true,
                nodeVersion: options.nodeVersion,
                type: PublishType.Dev
            };
            runImage = await buildDevDockerImage(publishOptions);
        } catch (err) {
            throw new Error(`Docker image build failed: ${err}`);
        }
    }

    try {
        signale.pending(`Tagging image ${runImage} as ${e2eImage}`);
        await dockerTag(runImage, e2eImage);
        signale.success(`Image ${runImage} re-tagged as ${e2eImage}`);
    } catch (err) {
        throw new Error(`Failed to tag docker image ${runImage} as ${e2eImage}: ${err}`);
    }
}
