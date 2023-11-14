import execa from 'execa';
import { debugLogger, pDelay } from '@terascope/utils';
import {
    createKindCluster,
    createNamespace,
    deployK8sTeraslice,
    dockerTag,
    isKindInstalled,
    isKubectlInstalled,
    kindStartService,
    kindStopService,
    loadTerasliceImage,
    setAliasAndBaseAssets
} from '../scripts';
import { k8sEnvOptions } from './interfaces';
import signale from '../signale';
import { getDevDockerImage, getRootInfo } from '../misc';
import { buildDevDockerImage } from '../publish/utils';
import { PublishOptions, PublishType } from '../publish/interfaces';

// import { TerasliceHarness } from 'e2e/test/teraslice-harness.js';
// const TerasliceHarness = require('e2e/test/teraslice-harness');

const logger = debugLogger('ts-scripts:cmd:k8s-env');

export async function launchK8sEnv(options: k8sEnvOptions) {
    logger.debug('Starting k8s environment with the following options: ', options);

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

    await createKindCluster();
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

    // FIXME: launch services
    const services = ['elasticsearch', 'kafka'];
    // Promise.all([])
    for (const service of options.services) {
        let version: string;
        if (service === 'kafka') {
            version = options[`${service}ImageVersion`] as string;
            signale.pending(`starting ${service}@${options.kafkaVersion} service...`);
        } else {
            version = options[`${service}Version`] as string;
            signale.pending(`starting ${service}@${version} service...`);
        }
        await kindStopService(service);
        // await kindLoadServiceImage(service, services[service].image, version);
        await kindStartService(service);
    }

    await deployK8sTeraslice();
}

