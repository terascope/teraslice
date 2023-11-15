// import { debugLogger } from '@terascope/utils';
import {
    createKindCluster,
    createNamespace,
    deployK8sTeraslice,
    dockerTag,
    isKindInstalled,
    isKubectlInstalled,
    loadTerasliceImage
} from '../scripts';
import { k8sEnvOptions } from './interfaces';
import signale from '../signale';
import { getDevDockerImage, getRootInfo } from '../misc';
import { buildDevDockerImage } from '../publish/utils';
import { PublishOptions, PublishType } from '../publish/interfaces';
import * as config from '../config';
import { ensureServices } from '../test-runner/services';

// const logger = debugLogger('ts-scripts:cmd:k8s-env');

export async function launchK8sEnv(options: k8sEnvOptions) {
    signale.pending('Starting k8s environment with the following options: ', options);

    const kindInstalled = await isKindInstalled();
    if (!kindInstalled) {
        signale.error('Please install Kind before launching a k8s dev environment. https://kind.sigs.k8s.io/docs/user/quick-start');
        process.exit(1);
    }

    const kubectlInstalled = await isKubectlInstalled();
    if (!kubectlInstalled) {
        signale.error('Please install kubectl before launching a k8s dev environment. https://kubernetes.io/docs/tasks/tools/');
        process.exit(1);
    }

    signale.pending('Creating kind cluster');
    await createKindCluster();
    signale.success('Kind cluster created');
    await createNamespace('services-ns.yaml');

    const rootInfo = getRootInfo();
    const e2eImage = `${rootInfo.name}:e2e`;

    try {
        if (options.skipBuild) {
            const devImage = `${getDevDockerImage()}-nodev${options.nodeVersion}`;
            await dockerTag(devImage, e2eImage);
        } else {
            const publishOptions: PublishOptions = {
                dryRun: true,
                nodeVersion: options.nodeVersion,
                type: PublishType.Dev
            };
            const devImage = await buildDevDockerImage(publishOptions);
            await dockerTag(devImage, e2eImage);
        }
    } catch (err) {
        signale.error('Docker image build failed: ', err);
        process.exit(1);
    }

    await loadTerasliceImage(e2eImage);

    await ensureServices('k8s_env', {
        ...options,
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

    await deployK8sTeraslice();
    signale.success('k8s environment ready.\nNext steps:\n\tAdd alias: teraslice-cli aliases add <cluster-alias> http://localhost:45678\n\t\tExample: teraslice-cli aliases add cluster1 http://localhost:45678\n\tLoad assets: teraslice-cli assets deploy <cluster-alias> <user/repo-name>\n\t\tExample: teraslice-cli assets deploy cluster1 terascope/elasticsearch-assets\n\tRegister a job: teraslice-cli tjm register <cluster-alias> <path/to/job/file.json>\n\t\tExample: teraslice-cli tjm reg cluster1 JOB.JSON\n\tStart a job: teraslice-cli tjm start <path/to/job/file.json>\n\t\tExample: teraslice-cli tjm start JOB.JSON\n\tSee the docs for more options: https://terascope.github.io/teraslice/docs/packages/teraslice-cli/overview');
}
